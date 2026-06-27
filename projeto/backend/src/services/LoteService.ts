// Entrada, ajuste, consumo e segregação de lotes. Cada método atualiza o lote e
// grava a Movimentação na mesma transação, para estoque e auditoria não
// divergirem (RN11/INV01). O estado inicial vem da validade (RN05/RN17).
import { eq, sql, and } from "drizzle-orm";
import type { DB } from "../db/client.js";
import { db as defaultDb } from "../db/client.js";

// Executor de transação: o parâmetro do callback de db.transaction. Compartilha
// a API de consulta com DB, mas não é o NodePgDatabase completo (sem $client).
type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
import { lote as loteTable, movimentacao as movTable, produto as produtoTable, itemDoPedido } from "../db/schema.js";
import type { Lote } from "../entities/index.js";
import { estadoValidadeLote } from "../domain/estoque.js";

export interface DadosEntradaLote {
  numeroLote: string;
  validade: string; // ISO YYYY-MM-DD
  quantidade: number;
  fabricacao?: string;
  responsavelId: number;
  qtdDanificada?: number;
  obsDanificada?: string;
}

export interface ResultadoEntrada {
  lote: Lote;
  movimentacaoId: string;
  entrouVencido: boolean;
  pedidosAguardando: number;
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
    if (dados.quantidade < 1) throw new Error("Quantidade total do lote deve ser >= 1");
    if (!dados.numeroLote || dados.numeroLote.trim() === "") {
      throw new Error("Número do lote é obrigatório");
    }

    // CEO-268: Lógica de abatimento de itens danificados
    const qtdDanificada = dados.qtdDanificada ?? 0;
    const obsDanificada = dados.obsDanificada ?? null;

    if (qtdDanificada < 0) throw new Error("A quantidade danificada não pode ser negativa");
    if (qtdDanificada > dados.quantidade) throw new Error("A quantidade danificada não pode ser maior que o total recebido");

    const quantidadeAtiva = dados.quantidade - qtdDanificada;

    return this.db.transaction(async (tx) => {
      const [prod] = await tx
        .select({ id: produtoTable.id })
        .from(produtoTable)
        .where(eq(produtoTable.id, produtoId))
        .limit(1);
      if (!prod) throw new Error(`Produto ${produtoId} não encontrado`);

      const estadoValidade = estadoValidadeLote(
        { validade: dados.validade } as Lote,
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
          quantidade: quantidadeAtiva,
          qtdDanificada: qtdDanificada,
          obsDanificada: obsDanificada,
          estado,
          ...(dados.fabricacao !== undefined ? { fabricacao: dados.fabricacao } : {}),
        })
        .returning();
      if (!loteCriado) throw new Error("Falha ao criar lote");

      let observacaoMovimento = `Entrada de lote ${dados.numeroLote} (recebimento).`;
      if (qtdDanificada > 0) {
        observacaoMovimento += ` Total NF: ${dados.quantidade}. Avarias: ${qtdDanificada}. Motivo: ${obsDanificada || "Não informado"}`;
      }

      const movId = await this.proximoIdMov(tx);
      await tx.insert(movTable).values({
        id: movId,
        tipo: "entrada",
        loteId: loteCriado.id,
        produtoId,
        quantidade: quantidadeAtiva,
        setorOrigemId: setorId,
        responsavelId: dados.responsavelId,
        observacao: observacaoMovimento,
      });
      
      const aguardandoResult = await tx
        .select({ count: sql<number>`count(distinct ${itemDoPedido.pedidoId})` })
        .from(itemDoPedido)
        .where(
          and(
            eq(itemDoPedido.produtoId, produtoId),
            eq(itemDoPedido.statusItem, "aguardando_reposicao")
          )
        );
      
      const pedidosAguardando = Number(aguardandoResult[0]?.count || 0);
      
      return {
        lote: loteCriado,
        movimentacaoId: movId,
        entrouVencido: estado === "vencido",
        pedidosAguardando,
      };
    });
  }

  /**
   * US-EP03-04 (CEO-239) — Recontagem física: ajusta a quantidade do lote para
   * o valor absoluto informado e gera Movimentação `ajuste` com o delta
   * (positivo = sobra encontrada, negativo = falta encontrada).
   *
   * fix: tipo era "saida", o que tornava auditorias impossíveis de distinguir
   * expedição de correção de inventário, e quebrava semântica quando delta > 0.
   */
  async ajustarQuantidade(
    loteId: number,
    novaQuantidade: number,
    responsavelId: number,
    observacao: string,
  ): Promise<Lote> {
    if (novaQuantidade < 0) {
      throw new Error("A quantidade de um lote não pode ser negativa");
    }
    if (!observacao || observacao.trim() === "") {
      throw new Error("Justificativa é obrigatória para ajustes de recontagem");
    }

    return this.db.transaction(async (tx) => {
      const [atual] = await tx
        .select()
        .from(loteTable)
        .where(eq(loteTable.id, loteId))
        .limit(1);

      if (!atual) throw new Error(`Lote ${loteId} não encontrado`);

      const delta = novaQuantidade - atual.quantidade;
      if (delta === 0) return atual;

      const [atualizado] = await tx
        .update(loteTable)
        .set({ quantidade: novaQuantidade })
        .where(eq(loteTable.id, loteId))
        .returning();

      if (!atualizado) throw new Error("Falha ao atualizar quantidade do lote");

      const movId = await this.proximoIdMov(tx);
      await tx.insert(movTable).values({
        id: movId,
        tipo: "ajuste",
        loteId,
        produtoId: atual.produtoId,
        quantidade: delta, 
        setorOrigemId: atual.setorId,
        responsavelId,
        observacao,
      });

      return atualizado;
    });
  }

  /**
   * US-EP03-03 (CEO-238) — Consumo clínico: abate a quantidade consumida do
   * saldo do lote e gera Movimentação `consumo`.
   *
   * fix: tipo era "saida", misturando consumo clínico com expedição por pedido —
   * dois eventos distintos que o almoxarife precisa distinguir nos relatórios.
   */
  async registrarConsumo(
    loteId: number,
    quantidadeAAbater: number,
    responsavelId: number,
    observacao?: string,
  ): Promise<Lote> {
    if (quantidadeAAbater <= 0) {
      throw new Error("A quantidade de consumo deve ser maior que zero");
    }

    return this.db.transaction(async (tx) => {
      const [atual] = await tx
        .select()
        .from(loteTable)
        .where(eq(loteTable.id, loteId))
        .limit(1);

      if (!atual) throw new Error(`Lote ${loteId} não encontrado`);

      if (atual.quantidade < quantidadeAAbater) {
        throw new Error(`Estoque insuficiente. Saldo atual: ${atual.quantidade}`);
      }

      const novaQuantidade = atual.quantidade - quantidadeAAbater;

      const [atualizado] = await tx
        .update(loteTable)
        .set({ quantidade: novaQuantidade })
        .where(eq(loteTable.id, loteId))
        .returning();

      if (!atualizado) throw new Error("Falha ao registrar consumo no lote");

      const movId = await this.proximoIdMov(tx);
      await tx.insert(movTable).values({
        id: movId,
        tipo: "consumo", 
        loteId,
        produtoId: atual.produtoId,
        quantidade: -quantidadeAAbater,
        setorOrigemId: atual.setorId,
        responsavelId,
        observacao: observacao ?? "Consumo clínico registrado.",
      });

      return atualizado;
    });
  }

  /**
   * US-EP07-02 (CEO-213) — Segregação atômica: muda o estado do lote para
   * `segregado`, registra data e observação, e gera Movimentação `segregacao`
   * com o saldo completo negativo para que a auditoria reflita a retirada de
   * circulação.
   *
   * fix: movimentação gravava quantidade 0, deixando gap no log de auditoria —
   * o saldo sumia do sistema sem registro da causa.
   */
  async segregar(
    loteId: number,
    responsavelId: number,
    observacao: string,
    hoje: Date = new Date(),
  ): Promise<Lote> {
    if (!observacao || observacao.trim() === "") {
      throw new Error("Uma observação é obrigatória para a segregação do lote");
    }

    return this.db.transaction(async (tx) => {
      const [atual] = await tx
        .select()
        .from(loteTable)
        .where(eq(loteTable.id, loteId))
        .limit(1);

      if (!atual) throw new Error(`Lote ${loteId} não encontrado`);

      const saldoAnterior = atual.quantidade;

      const [atualizado] = await tx
        .update(loteTable)
        .set({
          estado: "segregado",
          quantidade: 0, 
          dataSegregacao: hoje.toISOString().slice(0, 10),
          observacaoSegregacao: observacao,
        })
        .where(eq(loteTable.id, loteId))
        .returning();

      if (!atualizado) throw new Error("Falha ao atualizar estado do lote para segregado");

      const movId = await this.proximoIdMov(tx);
      await tx.insert(movTable).values({
        id: movId,
        tipo: "segregacao",
        loteId,
        produtoId: atual.produtoId,
        quantidade: -saldoAnterior, 
        setorOrigemId: atual.setorId,
        responsavelId,
        observacao,
      });

      return atualizado;
    });
  }
}
