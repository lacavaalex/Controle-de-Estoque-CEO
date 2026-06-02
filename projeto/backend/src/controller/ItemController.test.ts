import { beforeEach, describe, expect, it, vi, type Mocked } from "vitest";
import type { Request, Response } from "express";
import { ItemController } from "./ItemController.js";
import type { Item } from "../entities/Item.js";
import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";

const mockItem: Item = {
  id: "001",
  name: "Luva Cirúrgica",
  category: "EPI",
  quantity: 105,
};

const createMockService = (): Mocked<IItemService> => ({
  addStock: vi.fn(),
  changeItemName: vi.fn(),
  changeItemCategory: vi.fn(),
  createItem: vi.fn(),
  listItems: vi.fn(),
});

const createMockResponse = (): Response => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(res.status).mockReturnValue(res);
  vi.mocked(res.json).mockReturnValue(res);

  return res;
};

describe("ItemController", () => {
  let service: Mocked<IItemService>;
  let controller: ItemController;
  let res: Response;

  beforeEach(() => {
    service = createMockService();
    controller = new ItemController(service);
    res = createMockResponse();
  });

  describe("addStock", () => {
    it("deve retornar 200 com o item atualizado", async () => {
      const updatedItem = { ...mockItem, quantity: 110 };
      service.addStock.mockResolvedValue(updatedItem);
      const req = {
        params: { id: "001" },
        body: { quantity: 5 },
      } as Request<{ id: string }>;

      await controller.addStock(req, res);

      expect(service.addStock).toHaveBeenCalledWith("001", 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedItem);
    });

    it("deve retornar 400 quando o serviço lançar erro", async () => {
      service.addStock.mockRejectedValue(new Error("Quantidade inválida"));
      const req = {
        params: { id: "001" },
        body: { quantity: 0 },
      } as Request<{ id: string }>;

      await controller.addStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Quantidade inválida" });
    });
  });

  describe("changeItemName", () => {
    it("deve retornar 200 com o item renomeado", async () => {
      const renamedItem = { ...mockItem, name: "Nova Luva" };
      service.changeItemName.mockResolvedValue(renamedItem);
      const req = {
        params: { id: "001" },
        body: { name: "Nova Luva" },
      } as Request<{ id: string }>;

      await controller.changeItemName(req, res);

      expect(service.changeItemName).toHaveBeenCalledWith("001", "Nova Luva");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(renamedItem);
    });

    it("deve retornar 400 quando o serviço lançar erro", async () => {
      service.changeItemName.mockRejectedValue(new Error("Nome inválido"));
      const req = {
        params: { id: "001" },
        body: { name: "" },
      } as Request<{ id: string }>;

      await controller.changeItemName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Nome inválido" });
    });
  });

  describe("changeItemCategory", () => {
    it("deve retornar 200 com o item atualizado", async () => {
      const updatedItem = { ...mockItem, category: "Material Cirúrgico" };
      service.changeItemCategory.mockResolvedValue(updatedItem);
      const req = {
        params: { id: "001" },
        body: { category: "Material Cirúrgico" },
      } as Request<{ id: string }>;

      await controller.changeItemCategory(req, res);

      expect(service.changeItemCategory).toHaveBeenCalledWith("001", "Material Cirúrgico");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedItem);
    });

    it("deve retornar 400 quando o serviço lançar erro", async () => {
      service.changeItemCategory.mockRejectedValue(new Error("Categoria inválida"));
      const req = {
        params: { id: "001" },
        body: { category: "Categoria Inexistente" },
      } as Request<{ id: string }>;

      await controller.changeItemCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Categoria inválida" });
    });
  });

  describe("createItem", () => {
    it("deve retornar 200 com o item criado", async () => {
      const createdItem = {
        id: "011",
        name: "Sugador Descartável",
        category: "Higienização",
        quantity: 0,
      };
      service.createItem.mockResolvedValue(createdItem);
      const req = {
        body: { name: "Sugador Descartável", category: "Higienização" },
      } as Request;

      await controller.createItem(req, res);

      expect(service.createItem).toHaveBeenCalledWith("Sugador Descartável", "Higienização");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(createdItem);
    });

    it("deve retornar 400 quando o serviço lançar erro", async () => {
      service.createItem.mockRejectedValue(new Error("Item já existente"));
      const req = {
        body: { name: "Luva Cirúrgica", category: "EPI" },
      } as Request;

      await controller.createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Item já existente" });
    });
  });

  describe("listItems", () => {
    it("deve retornar 200 com todos os itens", async () => {
      const items = [
        mockItem,
        {
          id: "002",
          name: "Máscara Descartável (caixa)",
          category: "EPI",
          quantity: 30,
        },
      ];
      service.listItems.mockResolvedValue(items);
      const req = {} as Request;

      await controller.listItems(req, res);

      expect(service.listItems).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(items);
    });

    it("deve retornar 400 quando o serviço lançar erro", async () => {
      service.listItems.mockRejectedValue(new Error("Estoque vazio"));
      const req = {} as Request;

      await controller.listItems(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Estoque vazio" });
    });
  });
});
