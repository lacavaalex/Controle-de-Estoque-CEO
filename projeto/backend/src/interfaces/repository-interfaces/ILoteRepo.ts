import type { Lote, NovoLote } from "../../entities/index.js";

export interface ILoteRepository {
  criar(lote: NovoLote): Promise<Lote>;
  buscarPorId(id: number): Promise<Lote | null>;
  // Lotes de um produto num setor (base de qtd_total e do status agregado).
  listarPorProdutoSetor(produtoId: number, setorId: number): Promise<Lote[]>;
  // Todos os lotes de um setor (para listagens de estoque).
  listarPorSetor(setorId: number): Promise<Lote[]>;
  atualizar(id: number, props: Partial<Omit<Lote, "id">>): Promise<void>;
}
