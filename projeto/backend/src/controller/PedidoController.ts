import type { Request, Response } from "express";
import type { PedidoService, DadosNovoPedido } from "../services/PedidoService.js";
import { podeVerSetor, podeProcessarPedidos } from "../auth/rbac.js";

export class PedidoController {
  constructor(private pedidoService: PedidoService) {}

  // POST /pedidos — cria um pedido (solicitante/gestor do setor de origem).
  // O solicitante autenticado é a fonte da verdade de solicitanteId/origem.
  async criar(req: Request, res: Response): Promise<Response> {
    const id = req.identidade!;
    const { setorDestinoId, justificativa, itens } = req.body ?? {};
    const dados: DadosNovoPedido = {
      // origem e solicitante derivam da identidade (não confiar no corpo).
      setorOrigemId: Number(req.body?.setorOrigemId ?? id.setorId),
      setorDestinoId: Number(setorDestinoId),
      solicitanteId: id.usuarioId,
      justificativa,
      itens,
    };
    try {
      const pedido = await this.pedidoService.criar(dados);
      return res.status(201).json({ pedido });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // GET /pedidos/:id — detalha um pedido com seus itens.
  async detalhar(req: Request, res: Response): Promise<Response> {
    const id = req.identidade!;
    try {
      const pedido = await this.pedidoService.buscarPorId(req.params.id as string);
      if (pedido === null) return res.status(404).json({ mensagem: "Pedido não encontrado" });
      // RN12 — escopo de setor: só HO (global) ou quem participa do pedido
      // (setor de origem OU destino) pode vê-lo.
      if (!podeVerSetor(id, pedido.setorOrigemId) && !podeVerSetor(id, pedido.setorDestinoId)) {
        return res.status(403).json({ mensagem: "Acesso negado para o seu perfil/setor" });
      }
      return res.status(200).json({ pedido });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // GET /setores/:setorId/pedidos — lista pedidos do setor (origem ou destino).
  async listarPorSetor(req: Request, res: Response): Promise<Response> {
    try {
      const setorId = Number(req.params.setorId);
      const pedidos = await this.pedidoService.listarPorSetor(setorId);
      return res.status(200).json({ pedidos });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // POST /pedidos/:id/itens/:itemId/expedir — processa um item (almoxarife/gestor HO).
  async expedir(req: Request, res: Response): Promise<Response> {
    const id = req.identidade!;
    try {
      const resultado = await this.pedidoService.expedir(
        req.params.id as string,
        Number(req.params.itemId),
        id.usuarioId,
      );
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message.includes("não encontrado") ? 404 : 400;
        return res.status(status).json({ mensagem: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async listar(req: Request, res: Response): Promise<Response> {
    const id = req.identidade!;
    try {
      let pedidos;
      if (podeProcessarPedidos(id)) {
        pedidos = await this.pedidoService.listarTodos();
      } else {
        pedidos = await this.pedidoService.listarPorSetor(id.setorId);
      }
      return res.status(200).json({ pedidos });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
