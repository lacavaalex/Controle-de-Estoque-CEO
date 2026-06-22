import type { Request, Response } from "express";
import type { LoteService } from "../services/LoteService.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import { estadoValidadeLote } from "../domain/estoque.js";

export class LoteController {
  constructor(
    private loteService: LoteService,
    private loteRepo: ILoteRepository,
  ) {}

  // US-EP02-05 — entrada de lote (recebimento). setorId default = setor do usuário.
  async registrarEntrada(req: Request, res: Response): Promise<Response> {
    const produtoId = Number(req.params.id);
    const setorId = Number(req.body?.setorId ?? req.identidade?.setorId);
    const { numeroLote, validade, quantidade, fabricacao, qtdDanificada, obsDanificada } = req.body ?? {};
    const responsavelId = req.identidade?.usuarioId;
    if (responsavelId === undefined) return res.status(401).json({ mensagem: "Não autenticado" });

    try {
      const resultado = await this.loteService.registrarEntrada(produtoId, setorId, {
        numeroLote,
        validade,
        quantidade,
        fabricacao,
        responsavelId,
        qtdDanificada: qtdDanificada ? Number(qtdDanificada) : 0,
        obsDanificada
      });
      return res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message.includes("não encontrado") ? 404 : 400;
        return res.status(status).json({ mensagem: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // US-EP02-02 — lotes de um produto num setor; filtra vencido/segregado por padrão.
  async listarPorProduto(req: Request, res: Response): Promise<Response> {
    const produtoId = Number(req.params.id);
    const setorId = Number(req.query.setorId ?? req.identidade?.setorId);
    const incluirInativos = req.query.incluirInativos === "true";
    try {
      const lotes = await this.loteRepo.listarPorProdutoSetor(produtoId, setorId);
      const visiveis = incluirInativos ? lotes : lotes.filter((l) => l.estado === "ativo");
      const comEstado = visiveis.map((l) => ({
        ...l,
        estadoValidade: estadoValidadeLote(l),
      }));
      return res.status(200).json({ lotes: comEstado });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // US-EP02-06 / US-EP03-04 — ajuste absoluto por recontagem de inventário
  async ajustar(req: Request, res: Response): Promise<Response> {
    const loteId = Number(req.params.loteId);
    const { quantidade, observacao } = req.body ?? {};
    const responsavelId = req.identidade?.usuarioId;
    if (responsavelId === undefined) return res.status(401).json({ mensagem: "Não autenticado" });
    
    try {
      const lote = await this.loteService.ajustarQuantidade(
        loteId,
        Number(quantidade), // Quantidade absoluta informada pelo Gestor
        responsavelId,
        observacao
      );
      return res.status(200).json({ lote });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // US-EP03-03 — registro de consumo clínico
  async consumir(req: Request, res: Response): Promise<Response> {
    const loteId = Number(req.params.loteId);
    const { quantidade, observacao } = req.body ?? {};
    const responsavelId = req.identidade?.usuarioId;
    if (responsavelId === undefined) return res.status(401).json({ mensagem: "Não autenticado" });

    try {
      const lote = await this.loteService.registrarConsumo(
        loteId,
        Number(quantidade), // Quantidade a subtrair do estoque
        responsavelId,
        observacao
      );
      return res.status(200).json({ lote });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async segregarLote(req: Request, res: Response): Promise<Response> {
    const loteId = Number(req.params.loteId);
    const { observacao } = req.body ?? {};
    const responsavelId = req.identidade?.usuarioId;
    if (responsavelId === undefined) return res.status(401).json({ mensagem: "Não autenticado" });

    try {
      const lote = await this.loteService.segregar(loteId, responsavelId, observacao);
      return res.status(200).json({ lote });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  
  // US-EP07-02 — Lista os lotes na sala de biossegurança
  async listarSegregadosPorSetor(req: Request, res: Response): Promise<Response> {
    const setorId = Number(req.params.setorId);
    
    try {
      const segregados = await this.loteRepo.listarSegregadosPorSetor(setorId);
      return res.status(200).json({ segregados });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
