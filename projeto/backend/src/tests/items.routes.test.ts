import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import type { Item } from "../entities/Item.js";
import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";
import { ItemController } from "../controller/ItemController.js";

const itemExemplo: Item = {
  id: 1,
  nome: "Luva de Procedimento P",
  categoria: "EPI",
  lote: "458/24",
  quantidade: 105,
  unidade: "caixa",
  estoque_minimo: 50,
  estoque_maximo: 200,
  validade: "2027-03-31",
  localizacao: "Prateleira A-1",
  fornecedor: "DistribMed Ltda",
};

function criarServicoFalso(sobrescrever: Partial<IItemService> = {}): IItemService {
  return {
    listAll: vi.fn().mockResolvedValue([itemExemplo]),
    getById: vi.fn().mockResolvedValue(itemExemplo),
    addStock: vi.fn().mockResolvedValue({ ...itemExemplo, quantidade: 115 }),
    create: vi.fn().mockResolvedValue(itemExemplo),
    update: vi.fn().mockResolvedValue(itemExemplo),
    delete: vi.fn().mockResolvedValue(true),
    ...sobrescrever,
  };
}

function criarApp(servico: IItemService) {
  const controller = new ItemController(servico);
  const app = express();
  app.use(express.json());
  app.get("/items",         (req, res) => controller.listAll(req, res));
  app.get("/items/:id",    (req, res) => controller.getById(req, res));
  app.post("/items",        (req, res) => controller.create(req, res));
  app.patch("/items/:id",  (req, res) => controller.addStock(req, res));
  app.put("/items/:id",    (req, res) => controller.update(req, res));
  app.delete("/items/:id", (req, res) => controller.delete(req, res));
  return app;
}

describe("GET /items", () => {
  it("retorna 200 com lista de itens", async () => {
    const res = await request(criarApp(criarServicoFalso())).get("/items");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nome).toBe("Luva de Procedimento P");
  });

  it("repassa filtros de query para o serviço", async () => {
    const servico = criarServicoFalso();
    await request(criarApp(servico)).get("/items?nome=Luva&categoria=EPI");
    expect(servico.listAll).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Luva", categoria: "EPI" })
    );
  });
});

describe("GET /items/:id", () => {
  it("retorna 200 com o item quando encontrado", async () => {
    const res = await request(criarApp(criarServicoFalso())).get("/items/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("retorna 404 quando item não existe", async () => {
    const servico = criarServicoFalso({ getById: vi.fn().mockResolvedValue(null) });
    const res = await request(criarApp(servico)).get("/items/999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("retorna 400 para ID não numérico", async () => {
    const res = await request(criarApp(criarServicoFalso())).get("/items/abc");
    expect(res.status).toBe(400);
  });
});

describe("PATCH /items/:id (addStock)", () => {
  it("retorna 200 com item atualizado após entrada de estoque", async () => {
    const res = await request(criarApp(criarServicoFalso()))
      .patch("/items/1")
      .send({ quantidade: 10 });
    expect(res.status).toBe(200);
    expect(res.body.quantidade).toBe(115);
  });

  it("retorna 400 quando o serviço rejeita quantidade inválida", async () => {
    const servico = criarServicoFalso({
      addStock: vi.fn().mockRejectedValue(new Error("Quantidade inválida: deve ser um número inteiro positivo.")),
    });
    const res = await request(criarApp(servico))
      .patch("/items/1")
      .send({ quantidade: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/[Qq]uantidade/);
  });

  it("retorna 400 para ID não numérico", async () => {
    const res = await request(criarApp(criarServicoFalso()))
      .patch("/items/abc")
      .send({ quantidade: 5 });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /items/:id", () => {
  it("retorna 204 quando item é deletado", async () => {
    const res = await request(criarApp(criarServicoFalso())).delete("/items/1");
    expect(res.status).toBe(204);
  });

  it("retorna 404 quando item não existe", async () => {
    const servico = criarServicoFalso({ delete: vi.fn().mockResolvedValue(false) });
    const res = await request(criarApp(servico)).delete("/items/999");
    expect(res.status).toBe(404);
  });
});
