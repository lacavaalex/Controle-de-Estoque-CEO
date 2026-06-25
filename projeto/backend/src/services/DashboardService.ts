// DashboardService — agrega KPIs do dashboard por setor (CEO-248 / EP05).
// Reutiliza repos e EstoqueService; sem SQL novo.
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { IPedidoRepository } from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { EstoqueService } from "./EstoqueService.js";
import type { Lote } from "../entities/index.js";
import { diasParaVencer, loteEhAtivo } from "../domain/estoque.js";

export interface DemandaRepresadaItem {
  produtoId: number;
  nome: string;
  qtdSolicitadaTotal: number;
  numPedidos: number;
}

export interface DashboardKpis {
  totalProdutos: number;
  produtosCriticos: number;
  lotesVencendo30: number;
  lotesVencendo60: number;
  pedidosPendentes: number;
  demandaRepresada: DemandaRepresadaItem[];
}

export class DashboardService {
  constructor(
    private produtoRepo: IProdutoRepository,
    private loteRepo: ILoteRepository,
    private pedidoRepo: IPedidoRepository,
    private estoqueService: EstoqueService,
  ) {}

  async kpis(setorId: number, hoje: Date = new Date()): Promise<DashboardKpis> {
    const [produtos, lotes, pedidos] = await Promise.all([
      this.produtoRepo.listar(),
      this.loteRepo.listarPorSetor(setorId),
      this.pedidoRepo.listarPorSetor(setorId),
    ]);

    const estoque = await this.estoqueService.estoqueDoSetor(setorId, {}, hoje);

    return {
      totalProdutos: produtos.length,
      produtosCriticos: estoque.filter((p) => p.status === "critico").length,
      lotesVencendo30: contarLotesVencendo(lotes, hoje, 30),
      lotesVencendo60: contarLotesVencendo(lotes, hoje, 60),
      pedidosPendentes: pedidos.filter((p) => p.status === "pendente").length,
      demandaRepresada: await this.enriquecerDemandaRepresada(pedidos),
    };
  }

  private async enriquecerDemandaRepresada(
    pedidos: Awaited<ReturnType<IPedidoRepository["listarPorSetor"]>>,
  ): Promise<DemandaRepresadaItem[]> {
    const agrupado = new Map<number, { qtdSolicitadaTotal: number; pedidos: Set<string> }>();

    for (const pedido of pedidos) {
      for (const item of pedido.itens) {
        if (item.statusItem !== "aguardando_reposicao" || item.produtoId === null) continue;
        const produtoId = item.produtoId;
        const atual = agrupado.get(produtoId) ?? { qtdSolicitadaTotal: 0, pedidos: new Set() };
        atual.qtdSolicitadaTotal += item.qtdSolicitada;
        atual.pedidos.add(pedido.id);
        agrupado.set(produtoId, atual);
      }
    }

    const resultado: DemandaRepresadaItem[] = [];
    for (const [produtoId, dados] of agrupado) {
      const produto = await this.produtoRepo.buscarPorId(produtoId);
      resultado.push({
        produtoId,
        nome: produto?.nome ?? `Produto #${produtoId}`,
        qtdSolicitadaTotal: dados.qtdSolicitadaTotal,
        numPedidos: dados.pedidos.size,
      });
    }

    return resultado.sort((a, b) => b.qtdSolicitadaTotal - a.qtdSolicitadaTotal);
  }
}

/** Conta lotes ativos com 0 < dias para vencer <= limiteDias. */
export function contarLotesVencendo(lotes: Lote[], hoje: Date, limiteDias: number): number {
  return lotes.filter((l) => {
    if (!loteEhAtivo(l)) return false;
    const dias = diasParaVencer(l.validade, hoje);
    return dias > 0 && dias <= limiteDias;
  }).length;
}
