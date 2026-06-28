import type { Request, Response } from "express";
import type { DashboardService } from "../services/DashboardService.js";
import type { TipoMovimentacao } from "../entities/index.js";

// Converte um query param de data (YYYY-MM-DD) em Date UTC à meia-noite.
// Retorna undefined para ausente/ inválido (o filtro simplesmente não se aplica).
function parseDataQuery(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

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
    // Filtro por intervalo de datas (YYYY-MM-DD). Datas inválidas são ignoradas.
    const periodo = {
      dataInicio: parseDataQuery(req.query.dataInicio),
      dataFim: parseDataQuery(req.query.dataFim),
    };
    try {
      const data = await this.dashboardService.ultimasMovimentacoes(setorId, limite, tipo, periodo);
      return res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
