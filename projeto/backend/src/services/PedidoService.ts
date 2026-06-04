// =============================================================================
// PedidoService — criação de pedido (EP04-01) e expedição (EP03 / RN19).
//
// criar()   — valida RN09 (justificativa>=10, >=1 item, XOR produto/descrição)
//             e delega a persistência atômica ao PgPedidoRepo. O status do
//             pedido nasce 'pendente' (derivado dos itens pendentes — RN10).
//
// expedir() — processa UM item pendente. ATENÇÃO ao duplo sentido de
//             origem/destino: no PEDIDO, setorOrigemId = setor que SOLICITA
//             (CEO) e setorDestinoId = almoxarifado HO. Os BENS fluem ao
//             contrário (RN19/INV09): saem do HO e entram no CEO. Então:
//             baixa lotes do HO (= pedido.setorDestinoId) em ordem FEFO (RN20),
//             registra saída@HO + entrada@CEO, cria/atualiza o lote-CEO
//             correspondente (RN19) e grava qtdExpedida/statusItem/motivo
//             (RN16) no item. Tudo na MESMA transação (estoque + auditoria
//             nunca divergem — INV01/INV05). Ao final, recalcula o pedido (RN10).
//
// A regra de alocação é PURA (domain/pedido.planejarExpedicaoItem); aqui só há
// orquestração de I/O, espelhando LoteService.
// =============================================================================
import { and, eq, isNull, sql } from "drizzle-orm";
import type { DB } from "../db/client.js";
import { db as defaultDb } from "../db/client.js";
import {
  itemDoPedido as itemTable,
  lote as loteTable,
  movimentacao as movTable,
  pedido as pedidoTable,
} from "../db/schema.js";
import type {
  ItemDoPedido,
  Lote,
  StatusItem,
  Unidade,
} from "../entities/index.js";
import {
  direcaoExpedicao,
  planejarEntradaCeo,
  planejarExpedicaoItem,
  statusDerivadoDoPedido,
} from "../domain/pedido.js";
import type { IPedidoRepository, PedidoComItens } from "../interfaces/repository-interfaces/IPedidoRepo.js";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

// ─── Payloads de entrada ─────────────────────────────────────────────────────

export interface ItemNovoPedido {
  // XOR (INV07): exatamente um entre produtoId e descricaoLivre.
  produtoId?: number;
  descricaoLivre?: string;
  qtdSolicitada: number;
  unidade: Unidade;
}

export interface DadosNovoPedido {
  setorOrigemId: number; // setor que SOLICITA (ex.: CEO) — direção da requisição
  setorDestinoId: number; // almoxarifado HO que atende (sempre HO no MVP)
  solicitanteId: number;
  justificativa: string;
  itens: ItemNovoPedido[];
}

export interface ResultadoExpedicao {
  item: ItemDoPedido;
  movimentacoes: string[]; // ids MOV-NNN geradas
  statusPedido: string; // status (derivado) do pedido após a expedição
}

export class PedidoService {
  constructor(
    private pedidoRepo: IPedidoRepository,
    private db: DB = defaultDb,
  ) {}

  // ─── Criação (EP04-01 / RN09) ──────────────────────────────────────────────

  async criar(dados: DadosNovoPedido): Promise<PedidoComItens> {
    if (!dados.justificativa || dados.justificativa.trim().length < 10) {
      throw new Error("Justificativa deve ter ao menos 10 caracteres (RN09)");
    }
    if (!dados.itens || dados.itens.length === 0) {
      throw new Error("Pedido deve ter ao menos um item (RN09)");
    }
    if (!Number.isInteger(dados.setorOrigemId) || !Number.isInteger(dados.setorDestinoId)) {
      throw new Error("setorOrigemId e setorDestinoId devem ser inteiros válidos");
    }
    if (dados.setorOrigemId === dados.setorDestinoId) {
      throw new Error("Setor de origem e destino não podem ser o mesmo");
    }

    const itens = dados.itens.map((i, idx) => {
      const temProduto = i.produtoId !== undefined && i.produtoId !== null;
      const temDescricao =
        i.descricaoLivre !== undefined && i.descricaoLivre.trim() !== "";
      // INV07 — XOR entre produtoId e descricaoLivre.
      if (temProduto === temDescricao) {
        throw new Error(
          `Item ${idx + 1}: informe produtoId OU descricaoLivre (exatamente um) — INV07`,
        );
      }
      if (i.qtdSolicitada < 1) {
        throw new Error(`Item ${idx + 1}: quantidade solicitada deve ser >= 1 (RN09)`);
      }
      return {
        ...(temProduto ? { produtoId: i.produtoId } : { descricaoLivre: i.descricaoLivre }),
        qtdSolicitada: i.qtdSolicitada,
        unidade: i.unidade,
        statusItem: "pendente" as StatusItem,
      };
    });

    return this.pedidoRepo.criar(
      {
        setorOrigemId: dados.setorOrigemId,
        setorDestinoId: dados.setorDestinoId,
        solicitanteId: dados.solicitanteId,
        justificativa: dados.justificativa,
      },
      itens,
    );
  }

  // ─── Expedição (EP03 / RN19) ───────────────────────────────────────────────

  private async proximoIdMov(tx: Tx): Promise<string> {
    const r = await tx.execute<{ id: string }>(
      sql`SELECT 'MOV-' || lpad(nextval('seq_movimentacao')::text, 3, '0') AS id`,
    );
    const row = r.rows[0];
    if (!row) throw new Error("Falha ao gerar id da movimentação");
    return row.id;
  }

  /**
   * Expede um item de produto (descricaoLivre não é expedível — não tem lote).
   * `responsavelId` é o almoxarife/gestor HO que processa (RN11).
   */
  async expedir(
    pedidoId: string,
    itemId: number,
    responsavelId: number,
    hoje: Date = new Date(),
  ): Promise<ResultadoExpedicao> {
    return this.db.transaction(async (tx) => {
      // 1. Carrega pedido + item, com locks de leitura coerentes na transação.
      const [pedido] = await tx
        .select()
        .from(pedidoTable)
        .where(eq(pedidoTable.id, pedidoId))
        .limit(1);
      if (!pedido) throw new Error(`Pedido ${pedidoId} não encontrado`);

      const [item] = await tx
        .select()
        .from(itemTable)
        .where(and(eq(itemTable.id, itemId), eq(itemTable.pedidoId, pedidoId)))
        .limit(1);
      if (!item) throw new Error(`Item ${itemId} não encontrado no pedido ${pedidoId}`);
      if (item.statusItem !== "pendente") {
        throw new Error(`Item ${itemId} já foi processado (status ${item.statusItem})`);
      }
      if (item.produtoId === null) {
        throw new Error("Item de descrição livre não pode ser expedido (sem lote no catálogo)");
      }

      // Direção física (RN19/INV09): bens saem do HO (= pedido.setorDestinoId)
      // e entram no CEO (= pedido.setorOrigemId), ao contrário da requisição.
      const { setorHoId, setorCeoId } = direcaoExpedicao(pedido);

      // 2. Lotes do produto no HO, travados (FOR UPDATE) contra expedições
      //    concorrentes (INV05/INV08), e plano FEFO (domínio puro).
      const lotesHo = (await tx
        .select()
        .from(loteTable)
        .where(
          and(
            eq(loteTable.produtoId, item.produtoId),
            eq(loteTable.setorId, setorHoId),
          ),
        )
        .for("update")) as Lote[];

      const plano = planejarExpedicaoItem(item.qtdSolicitada, lotesHo, hoje);

      // 3. Baixa cada lote-HO e registra a saída@HO (RN11). quantidade negativa
      //    espelha a convenção do seed (MOV saída = -qtd).
      const movimentacoes: string[] = [];
      for (const aloc of plano.alocacoes) {
        const loteAtual = lotesHo.find((l) => l.id === aloc.loteId)!;
        const novaQtd = loteAtual.quantidade - aloc.quantidade;
        await tx
          .update(loteTable)
          .set({ quantidade: novaQtd })
          .where(eq(loteTable.id, aloc.loteId));

        const movId = await this.proximoIdMov(tx);
        await tx.insert(movTable).values({
          id: movId,
          tipo: "saida",
          loteId: aloc.loteId,
          produtoId: item.produtoId,
          quantidade: -aloc.quantidade,
          setorOrigemId: setorHoId,
          setorDestinoId: setorCeoId,
          responsavelId,
          pedidoId,
          observacao: `Expedição do pedido ${pedidoId} (item ${itemId}).`,
        });
        movimentacoes.push(movId);
      }

      // 3b. RN19/INV09 — segunda perna: cria/atualiza o lote-CEO e registra a
      //     entrada@CEO. Lê os lotes-CEO travados para um upsert seguro.
      if (plano.alocacoes.length > 0) {
        const lotesCeo = (await tx
          .select()
          .from(loteTable)
          .where(
            and(
              eq(loteTable.produtoId, item.produtoId),
              eq(loteTable.setorId, setorCeoId),
            ),
          )
          .for("update")) as Lote[];

        const legs = planejarEntradaCeo(plano.alocacoes, lotesHo, lotesCeo);
        for (const leg of legs) {
          let loteCeoId: number;
          if (leg.loteCeoExistenteId !== null) {
            const [atualizado] = await tx
              .update(loteTable)
              .set({ quantidade: sql`${loteTable.quantidade} + ${leg.quantidade}` })
              .where(eq(loteTable.id, leg.loteCeoExistenteId))
              .returning({ id: loteTable.id });
            loteCeoId = atualizado!.id;
          } else {
            const [criado] = await tx
              .insert(loteTable)
              .values({
                produtoId: item.produtoId,
                setorId: setorCeoId,
                numeroLote: leg.numeroLote,
                validade: leg.validade,
                quantidade: leg.quantidade,
                estado: "ativo",
                ...(leg.fabricacao !== null ? { fabricacao: leg.fabricacao } : {}),
              })
              .returning({ id: loteTable.id });
            loteCeoId = criado!.id;
          }

          const movEntradaId = await this.proximoIdMov(tx);
          await tx.insert(movTable).values({
            id: movEntradaId,
            tipo: "entrada",
            loteId: loteCeoId,
            produtoId: item.produtoId,
            quantidade: leg.quantidade,
            setorOrigemId: setorHoId,
            setorDestinoId: setorCeoId,
            responsavelId,
            pedidoId,
            observacao: `Entrada-CEO automática via expedição do pedido ${pedidoId} (RN19).`,
          });
          movimentacoes.push(movEntradaId);
        }
      }

      // 4. Grava o resultado no item-pai (RN16). loteExpedidoId só quando a saída
      //    veio de um único lote; com múltiplos lotes ele fica null e a quebra por
      //    lote é materializada em itens-filho (RF05.17 — passo 4b).
      const loteUnico =
        plano.alocacoes.length === 1 ? plano.alocacoes[0]!.loteId : null;

      const [itemAtualizado] = await tx
        .update(itemTable)
        .set({
          qtdExpedida: plano.qtdExpedida,
          statusItem: plano.statusItem,
          loteExpedidoId: loteUnico,
          motivoDivergencia: plano.motivoDivergencia ?? null,
          processadoPorId: responsavelId,
          dataProcessamento: new Date(),
        })
        .where(eq(itemTable.id, itemId))
        .returning();
      if (!itemAtualizado) throw new Error("Falha ao atualizar item do pedido");

      // 4b. RF05.17 — desdobramento em itens-filho quando a saída veio de >1 lote.
      //     Cada filho registra a parcela (qtd + lote) e aponta itemPaiId ao item
      //     original; serve de rastreabilidade. Os filhos NÃO entram no cálculo do
      //     status do pedido (item-pai já carrega o status agregado — ver passo 5).
      if (plano.alocacoes.length > 1) {
        await tx.insert(itemTable).values(
          plano.alocacoes.map((aloc) => ({
            pedidoId,
            produtoId: item.produtoId,
            qtdSolicitada: aloc.quantidade,
            qtdExpedida: aloc.quantidade,
            loteExpedidoId: aloc.loteId,
            unidade: item.unidade,
            statusItem: "atendido_integral" as StatusItem,
            itemPaiId: itemId,
            processadoPorId: responsavelId,
            dataProcessamento: new Date(),
          })),
        );
      }

      // 5. Recalcula o status (derivado) do pedido (RN10). Considera apenas os
      //    itens RAIZ (itemPaiId IS NULL): os filhos são detalhamento de um item
      //    que já contribui com seu próprio status, e contá-los distorceria RN10.
      const itensAtuais = await tx
        .select({ statusItem: itemTable.statusItem })
        .from(itemTable)
        .where(and(eq(itemTable.pedidoId, pedidoId), isNull(itemTable.itemPaiId)));
      const statusPedido = statusDerivadoDoPedido(itensAtuais.map((i) => i.statusItem));
      await tx
        .update(pedidoTable)
        .set({ status: statusPedido })
        .where(eq(pedidoTable.id, pedidoId));

      return { item: itemAtualizado, movimentacoes, statusPedido };
    });
  }

  // ─── Leitura ────────────────────────────────────────────────────────────────

  async buscarPorId(id: string): Promise<PedidoComItens | null> {
    return this.pedidoRepo.buscarPorId(id);
  }

  async listarPorSetor(setorId: number): Promise<PedidoComItens[]> {
    return this.pedidoRepo.listarPorSetor(setorId);
  }
}
