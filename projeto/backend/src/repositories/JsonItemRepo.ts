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

    async getItemById(id: string): Promise<Item | null> {
        const items = await readItems();
        const item = items.find((item: Item) => item.id === id);

        return item ?? null;
    }

    async updateItem(id: string, updateProperties: Partial<Omit<Item, "id">>): Promise<void> {
        const items = await readItems();
        const itemIndex = items.findIndex((currentItem: Item) => currentItem.id === id);

        const updatedItem: Item = {
            ...items[itemIndex],
            ...updateProperties,
        };

        items[itemIndex] = updatedItem;
        await writeItems(items);
    }

    async deleteItem(id: string): Promise<void> {
        const items = await readItems();
        const itemIndex = items.findIndex((item: Item) => item.id === id);

        items.splice(itemIndex, 1);

        await writeItems(items);
    }
}