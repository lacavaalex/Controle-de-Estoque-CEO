import type { Item } from "../../entities/Item.js";
import type { CategoriaItem } from "../../entities/enums.js";

export interface IItemRepository {
  findAll(filtros?: {
    nome?: string;
    lote?: string;
    categoria?: CategoriaItem;
  }): Promise<Item[]>;

  findById(id: number): Promise<Item | null>;

  create(item: Omit<Item, "id">): Promise<Item>;

  update(id: number, dados: Partial<Omit<Item, "id">>): Promise<Item | null>;

  delete(id: number): Promise<boolean>;

  findVencendo(dias: number): Promise<Item[]>;

  findCriticos(): Promise<Item[]>;
}
