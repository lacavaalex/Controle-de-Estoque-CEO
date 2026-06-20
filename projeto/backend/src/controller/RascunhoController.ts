import type { Request, Response } from "express";
import type { RascunhoService, DadosAprovacao } from "../services/RascunhoService.js";

export class RascunhoController {
  constructor(private rascunhoService: RascunhoService) {}

  // POST /rascunhos — chamado pelo agente (Bearer AGENTE_TOKEN; auth de serviço
  // no middleware da rota). Idempotente: 201 se gravou agora, 200 se o
  // messageId já existia (não é erro — inbox pattern, ADR-0004).
  async receber(req: Request, res: Response): Promise<Response> {
    const { messageId, emailCru, remetenteEmail, remetenteNome, jsonExtraido, confiancaGeral, temAnexo } =
      req.body ?? {};
    try {
      const { rascunho, criado } = await this.rascunhoService.registrar({
        messageId,
        emailCru,
        remetenteEmail,
        remetenteNome,
        jsonExtraido,
        confiancaGeral,
        temAnexo,
      });
      return res.status(criado ? 201 : 200).json({ rascunho, criado });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // ─── Triagem (CEO-276) — almoxarife/gestor HO (RBAC na rota) ────────────────

  // GET /rascunhos?status=pendente — fila da triagem.
  async listar(req: Request, res: Response): Promise<Response> {
    try {
      // No MVP só a fila pendente é exposta; o filtro fica explícito na query.
      const status = (req.query.status as string) ?? "pendente";
      if (status !== "pendente") {
        return res.status(400).json({ mensagem: "Filtro suportado: status=pendente" });
      }
      const rascunhos = await this.rascunhoService.listarPendentes();
      return res.status(200).json({ rascunhos });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // POST /rascunhos/:id/aprovar — promove o rascunho a pedido (em transação).
  async aprovar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    const { setorOrigemId, setorDestinoId, justificativa, itens } = req.body ?? {};
    const dados: DadosAprovacao = {
      setorOrigemId: Number(setorOrigemId),
      setorDestinoId: Number(setorDestinoId),
      justificativa,
      itens,
    };
    try {
      const pedido = await this.rascunhoService.promover(id, dados);
      return res.status(201).json({ pedido });
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message.includes("não encontrado") ? 404 : 400;
        return res.status(status).json({ mensagem: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // POST /rascunhos/:id/descartar — marca descartado (spam/duplicado/não-pedido).
  async descartar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    try {
      await this.rascunhoService.descartar(id);
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
