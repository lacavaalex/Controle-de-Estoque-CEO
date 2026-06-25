// =============================================================================
// DashboardService — agrega KPIs do dashboard por setor (CEO-248 / EP05).
// Reutiliza repos e EstoqueService; sem SQL novo.
// =============================================================================
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { IPedidoRepository } from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";
import type { IMovimentacaoRepository } from "../interfaces/repository-interfaces/IMovimentacaoRepo.js";
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
    private setorRepo: ISetorRepository,
    private movimentacaoRepo: IMovimentacaoRepository,
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

    async consumoMensalSetor(setorId: number, hoje: Date = new Date()): Promise<DashboardKpis> {
      // Reutiliza a agregação de KPIs para garantir consistência com `kpis()`.
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

    /**
     * Retorna consumo mensal por setor destinatário para os últimos `meses` meses
     * contado a partir do setor fornecedor (`setorId`, ex.: HO).
     * O formato é adequado para gráficos de barras: { meses: string[]; setores: { setorId?|nome|valores[] }[] }
     */
    async consumoMensalSetorFornecedor(
      setorFornecedorId: number,
      meses: number = 6,
      hoje: Date = new Date(),
    ): Promise<{ meses: string[]; setores: { setorId: number | null; nome: string; valores: number[] }[] }> {
      // Gera rótulos de mês YYYY-MM (UTC) dos últimos `meses` meses, ordem cronológica
      const labels: string[] = [];
      const base = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
      for (let i = meses - 1; i >= 0; i--) {
        const d = new Date(base);
        d.setUTCMonth(base.getUTCMonth() - i);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        labels.push(`${y}-${m}`);
      }

      // Nomes fixos esperados no produto final do gráfico (PO)
      const esperado = ["CEO", "CME", "Laboratórios", "Dispensação"];  // TODO

      const setoresCadastrados = await this.setorRepo.listar();

      const strip = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      const setores = esperado.map((nome) => {
        const achado = setoresCadastrados.find((s) => strip(s.nome).includes(strip(nome)));
        return {
          setorId: achado ? achado.id : null,
          nome,
          valores: Array.from({ length: labels.length }).map(() => 0),
        };
      });

      // Busca movimentações envolvendo o fornecedor (HO) e soma saídas por destino
      const movimentos = await this.movimentacaoRepo.listarPorSetor(setorFornecedorId);

      for (const mov of movimentos) {
        // Considera apenas saídas físicas do fornecedor (HO) — tipo 'saida'
        if (mov.setorOrigemId !== setorFornecedorId) continue;
        if (mov.tipo !== "saida") continue;

        const dt = new Date(mov.data);
        const label = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
        const idx = labels.indexOf(label);
        if (idx === -1) continue; // fora do intervalo desejado

        const destId = mov.setorDestinoId ?? null;
        const s = setores.find((ss) => ss.setorId === destId);
9
      }

      return { meses: labels, setores };
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
