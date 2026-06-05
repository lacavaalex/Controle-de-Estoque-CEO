import type { Item } from "../../entities/Item.js";

export interface IItemService{
    addStock(id: number, quantity: number): Promise<Item>
    changeItemName(id: number, name: string): Promise<Item>
    changeItemCategory(id: number, category: string): Promise<Item>
    createItem(
        name: string,
        category: string,
        unit: string,
        minimumStock: number,
        maximumStock: number,   
        ): Promise<Item>
    listItems(): Promise<Item[]>
}