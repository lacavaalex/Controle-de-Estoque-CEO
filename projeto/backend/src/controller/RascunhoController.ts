import type { Request, Response } from "express";
import type { RascunhoService, DadosAprovacao } from "../services/RascunhoService.js";

// Mapeia um erro para {status, mensagem} sem vazar internals do banco.
// Erros de validação do domínio/serviço viram resposta 4xx.
// a mensagem é segura e útil ao cliente. Erros do driver Postgres trazem um
// `code` (ex.: "23503" FK) e/ou outras props — nesses a mensagem crua expõe nomes
// de constraint/tabela, então respondemos genérico (500).
function mapearErro(error: unknown): { status: number; corpo: object } {
  if (error instanceof Error && !("code" in error)) {
    const msg = error.message;
    if (msg.includes("não encontrado")) return { status: 404, corpo: { mensagem: msg } };
    // Conflito de concorrência (rascunho já decidido por outro operador): 409,
    // não 400 — não é input ruim do cliente, é estado já resolvido.
    if (msg.includes("já foi")) return { status: 409, corpo: { mensagem: msg } };
    return { status: 400, corpo: { mensagem: msg } };
  }
  return { status: 500, corpo: { error: "Erro interno do servidor" } };
}

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
      const { status, corpo } = mapearErro(error);
      return res.status(status).json(corpo);
    }
  }

  // Triagem (CEO-276) — almoxarife/gestor HO (RBAC na rota)

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
      const { status, corpo } = mapearErro(error);
      return res.status(status).json(corpo);
    }
  }

  // POST /rascunhos/:id/aprovar — promove o rascunho a pedido (em transação).
  async aprovar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    // Sem este guard, um :id não-numérico vira NaN e chega ao Postgres como
    // parâmetro int4 inválido (erro cru), e "1e3" viraria 1000 silenciosamente.
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensagem: "id do rascunho inválido" });
    }
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
      const { status, corpo } = mapearErro(error);
      return res.status(status).json(corpo);
    }
  }

  // POST /rascunhos/:id/descartar — marca descartado (spam/duplicado/não-pedido).
  async descartar(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensagem: "id do rascunho inválido" });
    }
    try {
      await this.rascunhoService.descartar(id);
      return res.status(204).send();
    } catch (error) {
      const { status, corpo } = mapearErro(error);
      return res.status(status).json(corpo);
    }
  }
}
