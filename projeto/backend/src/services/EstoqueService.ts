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
  type StatusProduto,
} from "../domain/estoque.js";

export interface ProdutoComEstoque {
  produtoId: number;
  nome: string;
  categoria: string;
  unidade: string;
  qtdTotal: number;
  status: StatusProduto;
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
  async estoqueDoSetor(setorId: number, hoje: Date = new Date()): Promise<ProdutoComEstoque[]> {
    const setor = await this.setorRepo.buscarPorId(setorId);
    if (setor === null) throw new Error(`Setor ${setorId} não encontrado`);

    const incluirExcessivo = setor.tipo === "almoxarifado";
    const produtos = await this.produtoRepo.listar();

    const resultado: ProdutoComEstoque[] = [];
    for (const p of produtos) {
      const lotes = await this.loteRepo.listarPorProdutoSetor(p.id, setorId);
      resultado.push({
        produtoId: p.id,
        nome: p.nome,
        categoria: p.categoria,
        unidade: p.unidade,
        qtdTotal: qtdTotal(lotes),
        status: statusProduto(p, lotes, { incluirExcessivo, hoje }),
      });
    }
    return resultado;
  }

  /**
   * RN20 — sugestão FEFO: lotes expedíveis de um produto num setor, ordenados
   * por validade mais próxima. Vencidos/segregados não aparecem (INV08).
   */
  async lotesParaExpedir(produtoId: number, setorId: number, hoje: Date = new Date()): Promise<Lote[]> {
    const lotes = await this.loteRepo.listarPorProdutoSetor(produtoId, setorId);
    return ordenarFEFO(lotes, hoje);
  }
}
