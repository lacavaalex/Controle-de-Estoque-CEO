import type { PedidoRascunho, NovoPedidoRascunho, StatusTriagem } from "../../entities/index.js";
import type { Tx } from "../../db/client.js";

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

  // Triagem (EP08 / CEO-276)
  /**
   * Busca por id. Com `tx`, lê na transação do chamador e trava a linha
   * (FOR UPDATE) — usado na promoção para impedir aprovação dupla concorrente.
   */
  buscarPorId(id: number, tx?: Tx): Promise<PedidoRascunho | null>;
  listarPorStatus(status: StatusTriagem): Promise<PedidoRascunho[]>;
  /** Marca aprovado e amarra ao pedido criado. Roda na transação da promoção. */
  marcarAprovado(id: number, pedidoId: string, tx: Tx): Promise<void>;
  /**
   * Marca descartado SE ainda estiver pendente (UPDATE condicional, atômico).
   * Retorna true se transicionou; false se já fora decidido (aprovado/descartado)
   * — fecha a corrida descartar↔aprovar sem precisar de transação explícita.
   */
  marcarDescartado(id: number): Promise<boolean>;
}
