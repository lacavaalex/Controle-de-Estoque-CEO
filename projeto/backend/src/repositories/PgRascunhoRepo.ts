// =============================================================================
// PgRascunhoRepo — antecâmara do Agente de Email (EP08 / ADR-0004).
// Gravação idempotente em pedido_rascunho via INSERT ... ON CONFLICT DO NOTHING
// sobre o índice único de message_id (inbox pattern). O backend continua dono
// único do banco; o agente só escreve por aqui (POST /rascunhos).
// =============================================================================
import { eq } from "drizzle-orm";
import type {
  IRascunhoRepository,
  ResultadoUpsertRascunho,
} from "../interfaces/repository-interfaces/IRascunhoRepo.js";
import type { PedidoRascunho, NovoPedidoRascunho } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { pedidoRascunho } from "../db/schema.js";

export class PgRascunhoRepo implements IRascunhoRepository {
  constructor(private db: DB = defaultDb) {}

  async upsert(rascunho: NovoPedidoRascunho): Promise<ResultadoUpsertRascunho> {
    // ON CONFLICT DO NOTHING: em inserção nova, RETURNING traz 1 linha; em
    // conflito (messageId já visto), traz 0 — e aí relemos a linha existente.
    const [inserido] = await this.db
      .insert(pedidoRascunho)
      .values(rascunho)
      .onConflictDoNothing({ target: pedidoRascunho.messageId })
      .returning();

    if (inserido) return { rascunho: inserido, criado: true };

    const existente = await this.buscarPorMessageId(rascunho.messageId);
    if (!existente) {
      // Conflito sem linha relegível é contradição (a menos de corrida de
      // exclusão concorrente, que não existe neste fluxo). Falha alto.
      throw new Error("Conflito de messageId sem rascunho correspondente");
    }
    return { rascunho: existente, criado: false };
  }

  async buscarPorMessageId(messageId: string): Promise<PedidoRascunho | null> {
    const [linha] = await this.db
      .select()
      .from(pedidoRascunho)
      .where(eq(pedidoRascunho.messageId, messageId))
      .limit(1);
    return linha ?? null;
  }
}
