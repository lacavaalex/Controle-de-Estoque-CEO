import type { Item } from "../../entities/Item.js";

export interface IItemRepository {
    createItem(item: Item): Promise<void>;
    getAllItems(): Promise<Item[]>;
    getItemById(id: string): Promise<Item | null>;
    updateItem(id: string, updatedProperties: Partial<Omit<Item, "id">>): Promise<void>;
    deleteItem(id: string): Promise<void>;
}