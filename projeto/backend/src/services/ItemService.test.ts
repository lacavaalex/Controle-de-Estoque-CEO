import { describe, it, expect } from "vitest";
import { ItemService } from "./ItemService.js";
import { JsonItemRepo } from "../repositories/JsonItemRepo.js";

const repo = new JsonItemRepo();
const service = new ItemService(repo);

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
    const resultado = await service.createItem("Sugador Descartável");

    expect(resultado).toEqual({
      id: String(items.length).padStart(3, "0"),
      name: "Sugador Descartável",
      quantity: 0,
    });
  });

  it("deve lançar erro se o item já existir", async () => {
    await expect(
      service.createItem("Luva Cirúrgica")
    ).rejects.toThrow("Item já existente");
  });

});

describe("addStock", () => {

  it("deve adicionar estoque ao item com sucesso", async () => {
    const item = await repo.getItemById("001");
    expect(item).not.toBeNull();

    try {
      const resultado = await service.addStock("001", 5);
      expect(resultado.quantity).toBe(item!.quantity + 5);
    } finally {
      await repo.updateItem("001", { quantity: item!.quantity });
    }
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
