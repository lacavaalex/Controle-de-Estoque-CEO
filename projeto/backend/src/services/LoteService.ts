// =============================================================================
// LoteService — entrada e ajuste de estoque (US-EP02-05 / EP02-06).
//
// registrarEntrada (RN: entrada de fornecedor) e ajustarQuantidade são
// ATÔMICOS: criam/atualizam o lote E geram a Movimentação na MESMA transação
// (db.transaction), para que estoque e auditoria nunca divirjam (RN11/INV01).
//
// O estado inicial do lote é derivado da validade (RN05/RN17): validade no
// passado entra como `vencido` (com aviso ao chamador via flag de retorno).
// =============================================================================
import { eq, sql } from "drizzle-orm";
import type { DB } from "../db/client.js";
import { db as defaultDb } from "../db/client.js";

// Executor de transação: o parâmetro do callback de db.transaction. Compartilha
// a API de consulta com DB, mas não é o NodePgDatabase completo (sem $client).
type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
import { lote as loteTable, movimentacao as movTable, produto as produtoTable } from "../db/schema.js";
import type { Lote, Unidade } from "../entities/index.js";
import { estadoValidadeLote } from "../domain/estoque.js";

export interface DadosEntradaLote {
  numeroLote: string;
  validade: string; // ISO YYYY-MM-DD
  quantidade: number;
  fabricacao?: string;
  responsavelId: number;
}

export interface ResultadoEntrada {
  lote: Lote;
  movimentacaoId: string;
  // true quando o lote entrou já vencido (front deve ter pedido confirmação).
  entrouVencido: boolean;
}

export class LoteService {
  constructor(private db: DB = defaultDb) {}

  private async proximoIdMov(tx: Tx): Promise<string> {
    const r = await tx.execute<{ id: string }>(
      sql`SELECT 'MOV-' || lpad(nextval('seq_movimentacao')::text, 3, '0') AS id`,
    );
    const row = r.rows[0];
    if (!row) throw new Error("Falha ao gerar id da movimentação");
    return row.id;
  }

  /**
   * US-EP02-05 — registra um lote novo (recebimento) e a Movimentação `entrada`,
   * atomicamente. setorId é o setor onde o lote fisicamente entra (HO no MVP).
   */
  async registrarEntrada(
    produtoId: number,
    setorId: number,
    dados: DadosEntradaLote,
    hoje: Date = new Date(),
  ): Promise<ResultadoEntrada> {
    if (dados.quantidade < 1) throw new Error("Quantidade do lote deve ser >= 1");
    if (!dados.numeroLote || dados.numeroLote.trim() === "") {
      throw new Error("Número do lote é obrigatório");
    }

    return this.db.transaction(async (tx) => {
      // Produto precisa existir (FK garante, mas damos erro amigável).
      const [prod] = await tx
        .select({ id: produtoTable.id })
        .from(produtoTable)
        .where(eq(produtoTable.id, produtoId))
        .limit(1);
      if (!prod) throw new Error(`Produto ${produtoId} não encontrado`);

      // Estado inicial pela validade (RN05/RN17).
      const estadoValidade = estadoValidadeLote(
        {
          // só os campos que estadoValidadeLote usa
          validade: dados.validade,
        } as Lote,
        hoje,
      );
      const estado = estadoValidade === "vencido" ? "vencido" : "ativo";

      const [loteCriado] = await tx
        .insert(loteTable)
        .values({
          produtoId,
          setorId,
          numeroLote: dados.numeroLote,
          validade: dados.validade,
          quantidade: dados.quantidade,
          estado,
          ...(dados.fabricacao !== undefined ? { fabricacao: dados.fabricacao } : {}),
        })
        .returning();
      if (!loteCriado) throw new Error("Falha ao criar lote");

      const movId = await this.proximoIdMov(tx);
      await tx.insert(movTable).values({
        id: movId,
        tipo: "entrada",
        loteId: loteCriado.id,
        produtoId,
        quantidade: dados.quantidade,
        setorOrigemId: setorId,
        responsavelId: dados.responsavelId,
        observacao: `Entrada de lote ${dados.numeroLote} (recebimento).`,
      });

      return {
        lote: loteCriado,
        movimentacaoId: movId,
        entrouVencido: estado === "vencido",
      };
    });
  }

  /**
   * US-EP02-06 — ajuste manual de quantidade do lote. Gera Movimentação `ajuste`
   * com o delta (qtd nova - antiga), atomicamente.
   */
  async ajustarQuantidade(
    loteId: number,
    novaQuantidade: number,
    responsavelId: number,
    observacao?: string,
  ): Promise<Lote> {
    if (novaQuantidade < 0) throw new Error("Quantidade não pode ser negativa (INV05)");

    return this.db.transaction(async (tx) => {
      const [atual] = await tx.select().from(loteTable).where(eq(loteTable.id, loteId)).limit(1);
      if (!atual) throw new Error(`Lote ${loteId} não encontrado`);

      const delta = novaQuantidade - atual.quantidade;
      if (delta === 0) return atual;

      const [atualizado] = await tx
        .update(loteTable)
        .set({ quantidade: novaQuantidade })
        .where(eq(loteTable.id, loteId))
        .returning();
      if (!atualizado) throw new Error("Falha ao atualizar lote");

      const movId = await this.proximoIdMov(tx);
      await tx.insert(movTable).values({
        id: movId,
        tipo: "ajuste",
        loteId,
        produtoId: atual.produtoId,
        quantidade: delta, // pode ser negativo
        setorOrigemId: atual.setorId,
        responsavelId,
        observacao: observacao ?? `Ajuste de inventário (delta ${delta}).`,
      });

      return atualizado;
    });
  }
}
