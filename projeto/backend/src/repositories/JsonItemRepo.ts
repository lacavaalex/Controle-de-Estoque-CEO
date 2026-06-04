import type { IItemRepository} from "../interfaces/repository-interfaces/IItemRepo.js";
import type { Item } from "../entities/Item.js";
import { readItems, writeItems } from "../utils/DB_IO.js";

export class JsonItemRepo implements IItemRepository {
    async createItem(item: Item): Promise<void> {
        const items = await readItems();
        items.push(item);
        await writeItems(items);
    }

    async getAllItems(): Promise<Item[]> {
        const items = await readItems();

        return items;
    }

    async getItemById(id: number): Promise<Item | null> {
        const items = await readItems();
        const item = items.find(item => item.id === id);

        return item ?? null;
    }

    async updateItem(id: number, updateProperties: Partial<Omit<Item, "id">>): Promise<void> {
        const items = await readItems();
        const itemIndex = items.findIndex(item => item.id === id);
        const item = items[itemIndex];

        if (!item) throw new Error(`Nenhum item com o id ${id} foi encontrado`)

        items[itemIndex] = {
            ...item,
            ...updateProperties,
        }

        await writeItems(items);
    }

    async deleteItem(id: number): Promise<void> {
        const items = await readItems();
        const itemIndex = items.findIndex(item => item.id === id);

        if (itemIndex === -1) throw new Error(`Nenhum item com o id ${id} foi encontrado`);

        items.splice(itemIndex, 1);
        await writeItems(items);
    }
}