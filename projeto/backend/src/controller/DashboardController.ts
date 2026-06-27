import type { Request, Response } from "express";
import type { DashboardService } from "../services/DashboardService.js";
import type { TipoMovimentacao } from "../entities/index.js";

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  async kpis(req: Request, res: Response): Promise<Response> {
    const setorId = Number(req.query.setorId ?? req.identidade!.setorId);
    try {
      const data = await this.dashboardService.kpis(setorId);
      return res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async consumoMensalSetor(req: Request, res: Response): Promise<Response> {
    // setorId aqui é o setor FORNECEDOR (ex.: HO); o serviço soma as saídas dele por destino.
    const setorId = Number(req.query.setorId ?? req.identidade!.setorId);
    const mesesRaw = Number(req.query.meses);
    const meses = Math.min(Math.max(Number.isFinite(mesesRaw) ? mesesRaw : 6, 1), 24); // 1..24, default 6
    try {
      const data = await this.dashboardService.consumoMensalSetorFornecedor(setorId, meses);
      return res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async ultimasMovimentacoes(req: Request, res: Response): Promise<Response> {
    const setorId = Number(req.query.setorId ?? req.identidade!.setorId);
    const limiteRaw = Number(req.query.limite);
    const limite = Math.min(Math.max(Number.isFinite(limiteRaw) ? limiteRaw : 10, 1), 100); // 1..100, default 10
    const tipo = (req.query.tipo as TipoMovimentacao | undefined) ?? undefined;
    try {
      const data = await this.dashboardService.ultimasMovimentacoes(setorId, limite, tipo);
      return res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
