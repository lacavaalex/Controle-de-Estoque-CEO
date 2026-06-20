import type { PedidoRascunho, NovoPedidoRascunho } from "../../entities/index.js";

// Resultado do upsert idempotente do rascunho (inbox pattern — ADR-0004).
// `criado` distingue inserção nova (201) de Message-ID já visto (200): em ambos
// os casos `rascunho` é a linha vigente para aquele messageId.
export interface ResultadoUpsertRascunho {
  rascunho: PedidoRascunho;
  criado: boolean;
}

export interface IRascunhoRepository {
  /**
   * Grava o rascunho de forma idempotente por messageId
   * (INSERT ... ON CONFLICT (message_id) DO NOTHING). O mesmo email nunca vira
   * dois rascunhos. Retorna a linha vigente e se ela foi criada agora.
   */
  upsert(rascunho: NovoPedidoRascunho): Promise<ResultadoUpsertRascunho>;
  buscarPorMessageId(messageId: string): Promise<PedidoRascunho | null>;
}
