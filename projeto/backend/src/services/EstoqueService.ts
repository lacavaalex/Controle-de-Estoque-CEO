// =============================================================================
// EstoqueService — orquestra repositórios + funções de domínio para entregar
// a visão de estoque (qtd_total + status agregado por produto, num setor).
// As regras vivem em domain/estoque.ts; o service só junta dados e aplica.
// =============================================================================
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";
import type { Lote } from "../entities/index.js";
import {
  qtdTotal,
  statusProduto,
  ordenarFEFO,
  exigeReposicao,
  exigeAtencaoValidade,
  compararSeveridade,
  type StatusProduto,
} from "../domain/estoque.js";

export interface ProdutoComEstoque {
  produtoId: number;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueMinimo: number;
  estoqueMaximo: number;
  localizacao: string | null;
  qtdTotal: number;
  status: StatusProduto;
}

export interface FiltrosCatalogo {
  texto?: string; // nome do produto (case-insensitive, substring)
  categoria?: string;
  status?: StatusProduto;
  somenteComEstoque?: boolean;
  somenteSemEstoque?: boolean;
}

export class EstoqueService {
  constructor(
    private produtoRepo: IProdutoRepository,
    private loteRepo: ILoteRepository,
    private setorRepo: ISetorRepository,
  ) {}

  /**
   * Estoque de um setor: para cada produto do catálogo, qtd_total e status
   * agregado. `incluirExcessivo` (RN04) só vale para setores almoxarifado (HO).
   */
  async estoqueDoSetor(
    setorId: number,
    filtros: FiltrosCatalogo = {},
    hoje: Date = new Date(),
  ): Promise<ProdutoComEstoque[]> {
    const setor = await this.setorRepo.buscarPorId(setorId);
    if (setor === null) throw new Error(`Setor ${setorId} não encontrado`);

    const incluirExcessivo = setor.tipo === "almoxarifado";
    const produtos = await this.produtoRepo.listar();

    let resultado: ProdutoComEstoque[] = [];
    for (const p of produtos) {
      const lotes = await this.loteRepo.listarPorProdutoSetor(p.id, setorId);
      resultado.push({
        produtoId: p.id,
        nome: p.nome,
        categoria: p.categoria,
        unidade: p.unidade,
        estoqueMinimo: p.estoqueMinimo,
        estoqueMaximo: p.estoqueMaximo,
        localizacao: p.localizacao,
        qtdTotal: qtdTotal(lotes),
        status: statusProduto(p, lotes, { incluirExcessivo, hoje }),
      });
    }

    // US-EP02-03 — filtros (aplicados sobre o agregado já calculado).
    if (filtros.texto) {
      const t = filtros.texto.toLowerCase();
      resultado = resultado.filter((r) => r.nome.toLowerCase().includes(t));
    }
    if (filtros.categoria) {
      resultado = resultado.filter((r) => r.categoria === filtros.categoria);
    }
    if (filtros.status) {
      resultado = resultado.filter((r) => r.status === filtros.status);
    }
    if (filtros.somenteComEstoque) {
      resultado = resultado.filter((r) => r.qtdTotal > 0);
    }
    if (filtros.somenteSemEstoque) {
      resultado = resultado.filter((r) => r.qtdTotal === 0);
    }
    return resultado;
  }

  /**
   * US-EP02-07 — visão do solicitante: catálogo agregado SEM detalhe de lote
   * (RN12). É o mesmo agregado, apenas sem `localizacao` (dado físico do lote/HO).
   */
  async catalogoParaSolicitante(
    setorId: number,
    filtros: FiltrosCatalogo = {},
    hoje: Date = new Date(),
  ): Promise<Array<Omit<ProdutoComEstoque, "localizacao" | "estoqueMaximo">>> {
    const completo = await this.estoqueDoSetor(setorId, filtros, hoje);
    return completo.map(({ localizacao, estoqueMaximo, ...resto }) => resto);
  }

  /**
   * RN20 — sugestão FEFO: lotes expedíveis de um produto num setor, ordenados
   * por validade mais próxima. Vencidos/segregados não aparecem (INV08).
   */
  async lotesParaExpedir(produtoId: number, setorId: number, hoje: Date = new Date()): Promise<Lote[]> {
    const lotes = await this.loteRepo.listarPorProdutoSetor(produtoId, setorId);
    return ordenarFEFO(lotes, hoje);
  }

  /**
   * CEO-250 (US-EP05) — Listas de alerta "vencendo / crítico" de um setor.
   *
   * Reusa o agregado de `estoqueDoSetor` (status por produto já calculado) e o
   * particiona nos dois grupos que exigem ação do gestor, cada um ordenado por
   * severidade (mais urgente primeiro):
   *
   *   - reposicao : produtos sem saldo ou abaixo do mínimo (RN03).
   *   - vencimento: produtos com lote ativo vencido/perto de vencer (RN05).
   *
   * Um mesmo produto pode aparecer nos DOIS grupos (ex.: indisponível por ter
   * só lote vencido) — são alertas independentes que pedem ações diferentes.
   */
  async alertas(
    setorId: number,
    hoje: Date = new Date(),
  ): Promise<{ reposicao: ProdutoComEstoque[]; vencimento: ProdutoComEstoque[] }> {
    const estoque = await this.estoqueDoSetor(setorId, {}, hoje);

    const reposicao = estoque
      .filter((p) => exigeReposicao(p.status))
      .sort((a, b) => compararSeveridade(a.status, b.status));

    const vencimento = estoque
      .filter((p) => exigeAtencaoValidade(p.status))
      .sort((a, b) => compararSeveridade(a.status, b.status));

    return { reposicao, vencimento };
  }
}
