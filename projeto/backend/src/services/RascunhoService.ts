// =============================================================================
// RascunhoService — admissão de solicitações por email (EP08 / ADR-0004).
//
// Princípio: admissão ≠ processamento. Este serviço só enche a antecâmara
// (pedido_rascunho). NÃO aplica RN10/INV nem cria pedido — rascunho não é
// pedido. A promoção rascunho→pedido roda na triagem (CEO-276), no backend,
// passando por todas as regras de domínio. Ver skill agente-dispensacao-rascunho.
// =============================================================================
import type {
  IRascunhoRepository,
  ResultadoUpsertRascunho,
} from "../interfaces/repository-interfaces/IRascunhoRepo.js";

// Corpo que o agente (worker Python) envia em POST /rascunhos.
export interface DadosNovoRascunho {
  messageId: string;
  emailCru: string;
  remetenteEmail?: string | null;
  remetenteNome?: string | null;
  // Saída da tool submit_solicitacao (LLM). Estrutura validada na triagem, não aqui.
  jsonExtraido?: unknown;
  confiancaGeral?: number | null;
  temAnexo?: boolean;
}

export class RascunhoService {
  constructor(private rascunhoRepo: IRascunhoRepository) {}

  /**
   * Valida o shape e grava de forma idempotente (ON CONFLICT por messageId).
   * Validação de admissão é mínima: o que garante a idempotência (messageId) e
   * a auditoria (emailCru). O resto é responsabilidade da triagem humana.
   */
  async registrar(dados: DadosNovoRascunho): Promise<ResultadoUpsertRascunho> {
    if (typeof dados.messageId !== "string" || dados.messageId.trim() === "") {
      throw new Error("messageId é obrigatório (idempotência por inbox pattern)");
    }
    if (typeof dados.emailCru !== "string" || dados.emailCru.trim() === "") {
      throw new Error("emailCru é obrigatório (auditoria e retreino)");
    }
    if (
      dados.confiancaGeral !== undefined &&
      dados.confiancaGeral !== null &&
      (typeof dados.confiancaGeral !== "number" ||
        dados.confiancaGeral < 0 ||
        dados.confiancaGeral > 1)
    ) {
      throw new Error("confiancaGeral deve estar entre 0 e 1");
    }

    return this.rascunhoRepo.upsert({
      messageId: dados.messageId.trim(),
      emailCru: dados.emailCru,
      remetenteEmail: dados.remetenteEmail ?? null,
      remetenteNome: dados.remetenteNome ?? null,
      // jsonb aceita qualquer JSON; a tipagem forte vem na triagem.
      jsonExtraido: dados.jsonExtraido ?? null,
      confiancaGeral: dados.confiancaGeral ?? null,
      ...(dados.temAnexo !== undefined ? { temAnexo: dados.temAnexo } : {}),
    });
  }
}
