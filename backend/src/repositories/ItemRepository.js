import { readItems, writeItems } from "../utils/db.js"
import { IItemRepository } from "../interfaces/repository-interfaces/IItemRepository.js";

export class ItemRepository extends IItemRepository {
    async createItem(name, quantity) {
        const items = await readItems();
        const newItem = {id: "", name, quantity};

        const newId = items.length + 1;
        newItem.id = String(newId).padStart(3, '0');

        items.push(newItem);

        await writeItems(items);
    }

    async getAllItems(){
        const items = await readItems();

        return items
    }

    async getItemByID(id){
        const items = await readItems();
        const item = items.find(i => i.id === id)

        return item
    }

    async updateQuantity(id, newQuantity){
        const items = await readItems();
        const item = items.find(i => i.id === id);
        item.quantity = newQuantity;

        await writeItems(items);
    }

    async updateName(id, newName){
        const items = await readItems();
        const item = items.find(i => i.id === id);
        item.name = newName;

        await writeItems(items);
    }

    async deleteItem(id) {
        const items = await readItems();
        const updatedItems = items.filter(i => i.id !== id);

        await writeItems(updatedItems)
    }
}