import type { Item } from "../../entities/Item.js";
import type { CategoriaItem } from "../../entities/enums.js";

export interface IItemService {
  listAll(filtros?: { nome?: string; lote?: string; categoria?: CategoriaItem }): Promise<Item[]>;
  getById(id: number): Promise<Item | null>;
  addStock(id: number, quantidade: number): Promise<Item>;
  create(item: Omit<Item, "id">): Promise<Item>;
  update(id: number, dados: Partial<Omit<Item, "id">>): Promise<Item | null>;
  delete(id: number): Promise<boolean>;
}
