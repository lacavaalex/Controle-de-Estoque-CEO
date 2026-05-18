import type { Item } from "../entities/Item.js";
import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";
import type { IItemRepository } from "../interfaces/repository-interfaces/IItemRepo.js";

export class ItemService implements IItemService{
    constructor(private itemRepository: IItemRepository) {}

    async addStock(id: string, quantity: number): Promise<Item> {
        const item = await this.itemRepository.getItemById(id);

        // Validações do ID e Quantidade
        if (item === null) throw new Error(`Nenhum item com o id ${id} foi encontrado`);
        if (typeof quantity !== "number" || Number.isNaN(quantity)) {
            throw new Error("Quantidade inválida");
        }
        if (quantity < 1 || quantity > 300) throw new Error('Não é possível adicionar uma quantidade menor que 1 ou maior que 300');
        
        // Operação no BD
        const newQuantity = item.quantity + quantity;
        await this.itemRepository.updateItem(id, {quantity: newQuantity});

        // Verificação se a operação ocorreu adequadamente
        const updatedItem = await this.itemRepository.getItemById(id);
        if (updatedItem === null) throw new Error('Estoque do item não pôde ser atualizado')

        return updatedItem;
    }

    // Metódo de renomeação de item

    async changeItemName(id: string, name: string): Promise<Item> {
        const item = await this.itemRepository.getItemById(id)

        if (item === null) throw new Error(`Nenhum item com o id ${id} foi encontrado`);
        if (typeof name !== "string" || name.trim() === "") {
            throw new Error("Nome inválido");
        }
        
        // Operação no BD
        const newName = name;
        await this.itemRepository.updateItem(id, {name: newName});

        // Verfirica se a operação ocorreu corretamente
        const renamedItem = await this.itemRepository.getItemById(id);
        if (renamedItem === null) throw new Error('O item não pôde ser renomeado')

        return renamedItem
    }
}