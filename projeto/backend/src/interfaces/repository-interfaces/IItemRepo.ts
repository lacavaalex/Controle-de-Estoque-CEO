import type { Item } from "../../entities/Item.js";
import type { CategoriaItem } from "../../entities/enums.js";

export interface IItemRepository {
    createItem(item: Item): Promise<void>;
    getAllItems(): Promise<Item[]>;
    getItemById(id: string): Promise<Item | null>;
    updateItem(id: string, updatedProperties: Partial<Omit<Item, "id">>): Promise<void>;
    deleteItem(id: string): Promise<void>;
}


// export interface IItemRepository {
//   getAll(filtros?: {
//     nome?: string;
//     lote?: string;
//     categoria?: CategoriaItem;
//   }): Promise<Item[]>;

//   getItemById(id: number): Promise<Item | null>;

//   createItem(item: Omit<Item, "id">): Promise<Item>;

//   updateItem(id: number, dados: Partial<Omit<Item, "id">>): Promise<Item | null>;

//   deleteItem(id: number): Promise<boolean>;

//   findVencendo(dias: number): Promise<Item[]>;

//   findCriticos(): Promise<Item[]>;
// }
