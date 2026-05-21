import type { Item } from "../entities/Item.js";
import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";
import type { IItemRepository } from "../interfaces/repository-interfaces/IItemRepo.js";
import type { CategoriaItem } from "../entities/enums.js";

export class ItemService implements IItemService {
  constructor(private itemRepository: IItemRepository) {}

  listAll(filtros?: { nome?: string; lote?: string; categoria?: CategoriaItem }): Promise<Item[]> {
    return this.itemRepository.findAll(filtros);
  }

  getById(id: number): Promise<Item | null> {
    return this.itemRepository.findById(id);
  }

  async addStock(id: number, quantidade: number): Promise<Item> {
    if (typeof quantidade !== "number" || Number.isNaN(quantidade) || quantidade < 1) {
      throw new Error("Quantidade inválida: deve ser um número inteiro positivo.");
    }
    if (quantidade > 9999) {
      throw new Error("Quantidade inválida: máximo de 9999 por entrada.");
    }

    const item = await this.itemRepository.findById(id);
    if (item === null) throw new Error(`Item ${id} não encontrado.`);

    const atualizado = await this.itemRepository.update(id, {
      quantidade: item.quantidade + quantidade,
    });
    if (atualizado === null) throw new Error("Não foi possível atualizar o estoque.");
    return atualizado;
  }

  create(item: Omit<Item, "id">): Promise<Item> {
    return this.itemRepository.create(item);
  }

  update(id: number, dados: Partial<Omit<Item, "id">>): Promise<Item | null> {
    return this.itemRepository.update(id, dados);
  }

  delete(id: number): Promise<boolean> {
    return this.itemRepository.delete(id);
  }
}
