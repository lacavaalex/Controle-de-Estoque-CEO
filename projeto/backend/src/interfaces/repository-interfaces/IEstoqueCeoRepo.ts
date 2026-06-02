import type { EstoqueCeo } from "../../entities/EstoqueCeo.js";

export interface IEstoqueCeoRepository {
  findAll(): Promise<EstoqueCeo[]>;                      // RF04.1
  findById(id: number): Promise<EstoqueCeo | null>;
  findByItemId(item_id: number): Promise<EstoqueCeo | null>;
  create(entry: Omit<EstoqueCeo, "id">): Promise<EstoqueCeo>;
  update(id: number, data: Partial<Omit<EstoqueCeo, "id" | "item_id">>): Promise<EstoqueCeo | null>;
  // INV05: delta positivo = entrada, negativo = saída/ajuste
  updateQuantidade(item_id: number, delta: number): Promise<EstoqueCeo | null>;
}
