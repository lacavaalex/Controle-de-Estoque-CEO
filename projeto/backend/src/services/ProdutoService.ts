// =============================================================================
// ProdutoService — catálogo (US-EP02-04 cadastrar, EP02-06 editar/remover).
// Categoria (RN02) e unidade são enums no banco; estoque min/max têm CHECK >= 0.
// Aqui validamos de forma amigável antes de chegar ao banco.
// =============================================================================
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { Produto, Categoria, Unidade } from "../entities/index.js";
import { loteEhAtivo } from "../domain/estoque.js";

const CATEGORIAS: readonly Categoria[] = [
  "EPI",
  "Anestésico",
  "Material Restaurador",
  "Instrumentais",
  "Higienização",
  "Material Cirúrgico",
  "Equipamento",
  "Outros",
];

const UNIDADES: readonly Unidade[] = [
  "caixa",
  "tubo",
  "seringa",
  "kit",
  "pacote",
  "rolo",
  "unidade",
  "frasco",
  "bastão",
  "folha",
  "par",
];

export interface DadosNovoProduto {
  nome: string;
  categoria: Categoria;
  unidade: Unidade;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  localizacao?: string;
  fornecedor?: string;
}

export class ProdutoService {
  constructor(
    private produtoRepo: IProdutoRepository,
    private loteRepo: ILoteRepository,
  ) {}

  private validar(dados: Partial<DadosNovoProduto>): void {
    if (dados.nome !== undefined && dados.nome.trim() === "") {
      throw new Error("Nome do produto é obrigatório");
    }
    if (dados.categoria !== undefined && !CATEGORIAS.includes(dados.categoria)) {
      throw new Error("Categoria inválida");
    }
    if (dados.unidade !== undefined && !UNIDADES.includes(dados.unidade)) {
      throw new Error("Unidade inválida");
    }
    if (dados.estoqueMinimo !== undefined && dados.estoqueMinimo < 0) {
      throw new Error("Estoque mínimo não pode ser negativo");
    }
    if (dados.estoqueMaximo !== undefined && dados.estoqueMaximo < 0) {
      throw new Error("Estoque máximo não pode ser negativo");
    }
  }

  async cadastrar(dados: DadosNovoProduto): Promise<Produto> {
    if (!dados.nome || dados.nome.trim() === "") throw new Error("Nome do produto é obrigatório");
    this.validar(dados);

    const jaExiste = await this.produtoRepo.buscarPorNome(dados.nome);
    if (jaExiste !== null) throw new Error("Já existe um produto com este nome no catálogo");

    return this.produtoRepo.criar({
      nome: dados.nome,
      categoria: dados.categoria,
      unidade: dados.unidade,
      ...(dados.estoqueMinimo !== undefined ? { estoqueMinimo: dados.estoqueMinimo } : {}),
      ...(dados.estoqueMaximo !== undefined ? { estoqueMaximo: dados.estoqueMaximo } : {}),
      ...(dados.localizacao !== undefined ? { localizacao: dados.localizacao } : {}),
      ...(dados.fornecedor !== undefined ? { fornecedor: dados.fornecedor } : {}),
    });
  }

  async editar(id: number, props: Partial<DadosNovoProduto>): Promise<Produto> {
    const atual = await this.produtoRepo.buscarPorId(id);
    if (atual === null) throw new Error(`Produto ${id} não encontrado`);
    this.validar(props);
    await this.produtoRepo.atualizar(id, props);
    const atualizado = await this.produtoRepo.buscarPorId(id);
    if (atualizado === null) throw new Error("Falha ao reler produto após edição");
    return atualizado;
  }

  /**
   * RN13 — só remove produto sem lotes ATIVOS (forçar segregação antes).
   * Verifica em todos os setores.
   */
  async remover(id: number): Promise<void> {
    const atual = await this.produtoRepo.buscarPorId(id);
    if (atual === null) throw new Error(`Produto ${id} não encontrado`);

    const lotes = await this.loteRepo.listarPorProdutoTodosSetores(id);
    if (lotes.some(loteEhAtivo)) {
      throw new Error(
        "Não é possível remover: o produto tem lotes ativos. Segregue ou esgote os lotes primeiro (RN13).",
      );
    }
    await this.produtoRepo.remover(id);
  }
}
