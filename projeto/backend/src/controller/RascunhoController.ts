import type { Request, Response } from "express";
import type { RascunhoService } from "../services/RascunhoService.js";

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
}
