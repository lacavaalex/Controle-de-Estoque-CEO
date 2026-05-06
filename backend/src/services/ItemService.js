import {IItemService} from "../interfaces/service-interfaces/IItemService.js"

export class ItemService extends IItemService {
    constructor(itemRepository) {
        super()
        this.itemRepository = itemRepository
    }

    async addStock(id, quantity){
        const item = await this.itemRepository.getItemByID(id);

        const isValidID = (item !== undefined);
        const isValidQuantity = (quantity > 0) && (quantity < 5000);

        if (!isValidID) throw new Error(`Nenhum item com ID ${id} foi encontrado`);
        if (!isValidQuantity) throw new Error('Não é possível adicionar uma quantidade menor que 0 ou maior que 5000');

        const newQuantity = item.quantity + quantity;
        await this.itemRepository.updateQuantity(item.id, newQuantity);

        const updatedItem = await this.itemRepository.getItemByID(id);

        return updatedItem
    }
}