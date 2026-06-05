import type { Item } from "../entities/Item.js";
import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";
import type { IItemRepository } from "../interfaces/repository-interfaces/IItemRepo.js";

export class ItemService implements IItemService{
    constructor(private itemRepository: IItemRepository) {}

    private category_options = [
        "EPI",
        "Anestésico",
        "Material Restaurador",
        "Instrumentais",
        "Higienização",
        "Material Cirúrgico",
        "Outros"
    ]

    // Dá entrada de um item do inventário
    async addStock(id: number, quantity: number): Promise<Item> {
        const item = await this.itemRepository.getItemById(id);

        // Validações do ID e Quantidade
        if (item === null) throw new Error(`Nenhum item com o id ${id} foi encontrado`);
        if (typeof quantity !== "number" || Number.isNaN(quantity)) {
            throw new Error("Quantidade inválida");
        }
        if (quantity < 1 || quantity > 300) throw new Error('Não é possível adicionar uma quantidade menor que 1 ou maior que 300');
        
        // Operação no BD
        try {
            const newQuantity = item.quantity + quantity
            await this.itemRepository.updateItem(id, {quantity: newQuantity})
            item.quantity = newQuantity
            return item
        } catch {
            throw new Error('Erro ao tentar dar entrada no item')
        }
    }

    // Metódo de renomeação de item
    async changeItemName(id: number, name: string): Promise<Item> {
        // Validação se o nome é válido
        if (typeof name !== "string" || name.trim() === "") throw new Error("Nome inválido")
        
        // Validação se o item existe 
        const items = await this.itemRepository.getAllItems()
        const item = items.find(item => item.id === id)
        if (item === undefined) throw new Error(`Nenhum item com o id ${id} foi encontrado`);

        // Validação se já existe um item com o mesmo nome que está tentando atualizar
        const hasName = items.some(item => item.name === name)
        if (hasName === true && item.name !== name) throw new Error('Já existe um item com o mesmo nome no estoque')

        // Operação no BD
        try {
            await this.itemRepository.updateItem(id, {name: name})
            item.name = name
            return item
        } catch {
            throw new Error('Erro ao tentar atualizar item')
        }
    }

    // Modifica a categoria de um item
    async changeItemCategory(id: number, category: string): Promise<Item> {
        // Validação se o item existe
        const items = await this.itemRepository.getAllItems()
        const item = items.find(item => item.id === id)
        if (item === undefined) throw new Error(`Nenhum item com o id ${id} foi encontrado`)

        // Verifica se a categoria existe
        if (!this.category_options.includes(category)) throw new Error("Categoria inválida")
        
        // Operação no BD
        try {
            await this.itemRepository.updateItem(id, {category: category})
            item.category = category
            return item
        } catch {
            throw new Error("Erro ao tentar atualizar o item")
        }
        
    }

    // Cria um novo item no inventário
    async createItem(name: string, category: string, unit: string, minimumStock: number, maximumStock: number): Promise<Item> {
        const items = await this.itemRepository.getAllItems()

        // Verifica se o já item existe
        const activeItems = items.filter(item => item.active === true)
        const ExistsItem = activeItems.some(i => i.name === name)
        if (ExistsItem === true) throw new Error("Item já existente")
        
        // Cria novo item
        const newID = items.length
        const newItem: Item = {id: newID, name: name, category:category, quantity: 0, unit: unit, minimumStock: minimumStock, maximumStock: maximumStock, active: true}

        // Add novo item no banco
        try {
            await this.itemRepository.createItem(newItem)
            return newItem
        } catch {
            throw new Error('Erro ao inserir item no banco de dados')
        }
    }

    // Lista todos os itens
    async listItems(): Promise<Item[]> {
        const items = await this.itemRepository.getAllItems()
        if (items.length === 0) throw new Error("Estoque vazio")
        return items
    }
}
