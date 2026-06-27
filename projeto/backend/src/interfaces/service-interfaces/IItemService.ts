import type { Item } from "../../entities/Item.js";

export interface IItemService{
    addStock(id: string, quantity: number): Promise<Item>
    changeItemName(id: string, name: string): Promise<Item>
    createItem(newName: string, category: string): Promise<Item>
}