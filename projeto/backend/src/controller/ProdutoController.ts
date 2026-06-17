import type { Request, Response } from "express";
import type { ProdutoService } from "../services/ProdutoService.js";

export class ProdutoController {
  constructor(private produtoService: ProdutoService) {}

  async cadastrar(req: Request, res: Response): Promise<Response> {
    const { nome, categoria, unidade, estoqueMinimo, estoqueMaximo, localizacao, fornecedor } =
      req.body ?? {};
    try {
      const produto = await this.produtoService.cadastrar({
        nome,
        categoria,
        unidade,
        estoqueMinimo,
        estoqueMaximo,
        localizacao,
        fornecedor,
      });
      return res.status(201).json({ produto });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async editar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    try {
      const produto = await this.produtoService.editar(id, req.body ?? {});
      return res.status(200).json({ produto });
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message.includes("não encontrado") ? 404 : 400;
        return res.status(status).json({ mensagem: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async remover(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    try {
      await this.produtoService.remover(id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message.includes("não encontrado") ? 404 : 400;
        return res.status(status).json({ mensagem: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
