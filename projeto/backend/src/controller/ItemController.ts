import type { IItemService } from "../interfaces/service-interfaces/IItemService.js";
import type { Request, Response } from "express";

export class ItemController {
  constructor(private itemService: IItemService) {}

  async listAll(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, lote, categoria } = req.query as Record<string, string | undefined>;
      const filtros: Parameters<IItemService["listAll"]>[0] = {};
      if (nome) filtros.nome = nome;
      if (lote) filtros.lote = lote;
      if (categoria) filtros.categoria = categoria as import("../entities/enums.js").CategoriaItem;
      const itens = await this.itemService.listAll(filtros);
      return res.status(200).json(itens);
    } catch {
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getById(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido." });
    try {
      const item = await this.itemService.getById(id);
      if (item === null) return res.status(404).json({ error: "Item não encontrado." });
      return res.status(200).json(item);
    } catch {
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async addStock(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido." });
    const { quantidade } = req.body as { quantidade: number };
    try {
      const atualizado = await this.itemService.addStock(id, quantidade);
      return res.status(200).json(atualizado);
    } catch (erro) {
      if (erro instanceof Error) return res.status(400).json({ error: erro.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await this.itemService.create(req.body);
      return res.status(201).json(item);
    } catch (erro) {
      if (erro instanceof Error) return res.status(400).json({ error: erro.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido." });
    try {
      const atualizado = await this.itemService.update(id, req.body);
      if (atualizado === null) return res.status(404).json({ error: "Item não encontrado." });
      return res.status(200).json(atualizado);
    } catch (erro) {
      if (erro instanceof Error) return res.status(400).json({ error: erro.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido." });
    try {
      const deletado = await this.itemService.delete(id);
      if (!deletado) return res.status(404).json({ error: "Item não encontrado." });
      return res.status(204).send();
    } catch {
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
