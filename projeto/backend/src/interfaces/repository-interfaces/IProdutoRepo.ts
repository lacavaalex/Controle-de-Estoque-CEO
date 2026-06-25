import type { Produto, NovoProduto } from "../../entities/index.js";

export interface IProdutoRepository {
  criar(produto: NovoProduto): Promise<Produto>;
  listar(): Promise<Produto[]>;
  buscarPorId(id: number): Promise<Produto | null>;
  buscarPorNome(nome: string): Promise<Produto | null>;
  atualizar(id: number, props: Partial<Omit<Produto, "id">>): Promise<void>;
  remover(id: number): Promise<void>;
}
