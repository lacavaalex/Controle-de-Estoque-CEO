import type { Request, Response } from "express";
import type { DashboardService } from "../services/DashboardService.js";

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
}
