import { beforeEach, describe, it, expect } from "vitest";
import { ItemService } from "./ItemService.js";
import type { Item } from "../entities/Item.js";
import type { IItemRepository } from "../interfaces/repository-interfaces/IItemRepo.js";

class InMemoryItemRepo implements IItemRepository {
  constructor(private items: Item[]) {}

  async createItem(item: Item): Promise<void> {
    this.items.push({ ...item });
  }

  async getAllItems(): Promise<Item[]> {
    return this.items.map((item) => ({ ...item }));
  }

  async getItemById(id: string): Promise<Item | null> {
    const item = this.items.find((item) => item.id === id);
    return item ? { ...item } : null;
  }

  async updateItem(id: string, updatedProperties: Partial<Omit<Item, "id">>): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === id);
    this.items[itemIndex] = {
      ...this.items[itemIndex],
      ...updatedProperties,
    };
  }

  async deleteItem(id: string): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === id);
    this.items.splice(itemIndex, 1);
  }
}

const createMockItems = (): Item[] => [
  { id: "000", name: "Item Base", category: "Outros", quantity: 1 },
  { id: "001", name: "Luva Cirúrgica", category: "EPI", quantity: 105 },
  { id: "002", name: "Máscara Descartável (caixa)", category: "EPI", quantity: 30 },
  { id: "003", name: "Resina Composta A2", category: "Material Restaurador", quantity: 48 },
  { id: "004", name: "Anestésico Lidocaína 2%", category: "Anestésico", quantity: 8 },
  { id: "005", name: "Fio de Sutura 3-0", category: "Material Cirúrgico", quantity: 20 },
  { id: "006", name: "Broca Carbide FG (kit)", category: "Instrumentais", quantity: 15 },
  { id: "007", name: "Papel Grau Cirúrgico (rolo)", category: "Higienização", quantity: 6 },
  { id: "008", name: "Ácido Fosfórico 37% (seringa)", category: "Material Restaurador", quantity: 25 },
  { id: "009", name: "Gaze Estéril (pacote)", category: "Material Cirúrgico", quantity: 40 },
  { id: "010", name: "Amalgama Encapsulado (caixa)", category: "Material Restaurador", quantity: 106 },
];

let repo: InMemoryItemRepo;
let service: ItemService;

beforeEach(() => {
  repo = new InMemoryItemRepo(createMockItems());
  service = new ItemService(repo);
});

describe("changeItemName", () => {

  it("deve renomear o item com sucesso", async () => {
    const resultado = await service.changeItemName("001", "Luva Cirúrgica");
    expect(resultado.name).toBe("Luva Cirúrgica");
  });

  it("deve lançar erro se o item não existir", async () => {
    await expect(
      service.changeItemName("999", "Qualquer Nome")
    ).rejects.toThrow("Nenhum item com o id 999 foi encontrado");
  });

  it("deve lançar erro se o nome for um número", async () => {
    await expect(
      service.changeItemName("001", 20 as any)
    ).rejects.toThrow("Nome inválido");
  });

  it("deve lançar erro se o nome for string vazia", async () => {
    await expect(
      service.changeItemName("001", "")
    ).rejects.toThrow("Nome inválido");
  });

  it("deve lançar erro se o nome for só espaços", async () => {
    await expect(
      service.changeItemName("001", "   ")
    ).rejects.toThrow("Nome inválido");
  });

});

describe("createItem", () => {

  it("deve criar o item com sucesso", async () => {
    const items = await repo.getAllItems();
    const resultado = await service.createItem("Sugador Descartável", "Higienização");

    expect(resultado).toEqual({
      id: String(items.length).padStart(3, "0"),
      name: "Sugador Descartável",
      category: "Higienização",
      quantity: 0,
    });
  });

  it("deve lançar erro se o item já existir", async () => {
    await expect(
      service.createItem("Luva Cirúrgica", "Outros")
    ).rejects.toThrow("Item já existente");
  });

});

describe("addStock", () => {

  it("deve adicionar estoque ao item com sucesso", async () => {
    const item = await repo.getItemById("001");
    expect(item).not.toBeNull();
    const initialQuantity = item!.quantity;

    const resultado = await service.addStock("001", 5);
    expect(resultado.quantity).toBe(initialQuantity + 5);
  });

  it("deve lançar erro se o item não existir", async () => {
    await expect(
      service.addStock("999", 5)
    ).rejects.toThrow("Nenhum item com o id 999 foi encontrado");
  });

  it("deve lançar erro se a quantidade for uma string", async () => {
    await expect(
      service.addStock("001", "5" as any)
    ).rejects.toThrow("Quantidade inválida");
  });

  it("deve lançar erro se a quantidade for NaN", async () => {
    await expect(
      service.addStock("001", Number.NaN)
    ).rejects.toThrow("Quantidade inválida");
  });

  it("deve lançar erro se a quantidade for menor que 1", async () => {
    await expect(
      service.addStock("001", 0)
    ).rejects.toThrow("Não é possível adicionar uma quantidade menor que 1 ou maior que 300");
  });

  it("deve lançar erro se a quantidade for maior que 300", async () => {
    await expect(
      service.addStock("001", 301)
    ).rejects.toThrow("Não é possível adicionar uma quantidade menor que 1 ou maior que 300");
  });

});
