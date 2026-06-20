// =============================================================================
// PgRascunhoRepo — antecâmara do Agente de Email (EP08 / ADR-0004).
// Gravação idempotente em pedido_rascunho via INSERT ... ON CONFLICT DO NOTHING
// sobre o índice único de message_id (inbox pattern). O backend continua dono
// único do banco; o agente só escreve por aqui (POST /rascunhos).
// =============================================================================
import { and, desc, eq } from "drizzle-orm";
import type {
  IRascunhoRepository,
  ResultadoUpsertRascunho,
} from "../interfaces/repository-interfaces/IRascunhoRepo.js";
import type { PedidoRascunho, NovoPedidoRascunho, StatusTriagem } from "../entities/index.js";
import { db as defaultDb, type DB, type Tx } from "../db/client.js";
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

  // ─── Triagem (CEO-276) ──────────────────────────────────────────────────────

  async buscarPorId(id: number, tx?: Tx): Promise<PedidoRascunho | null> {
    const executor = tx ?? this.db;
    // Na transação da promoção, trava a linha (FOR UPDATE) contra aprovação dupla.
    const base = executor.select().from(pedidoRascunho).where(eq(pedidoRascunho.id, id)).limit(1);
    const [linha] = tx ? await base.for("update") : await base;
    return linha ?? null;
  }

  async listarPorStatus(status: StatusTriagem): Promise<PedidoRascunho[]> {
    return this.db
      .select()
      .from(pedidoRascunho)
      .where(eq(pedidoRascunho.statusTriagem, status))
      .orderBy(desc(pedidoRascunho.criadoEm));
  }

  async marcarAprovado(id: number, pedidoId: string, tx: Tx): Promise<void> {
    await tx
      .update(pedidoRascunho)
      .set({ statusTriagem: "aprovado", pedidoId, processadoEm: new Date() })
      .where(eq(pedidoRascunho.id, id));
  }

  async marcarDescartado(id: number): Promise<boolean> {
    // UPDATE condicional: só transiciona se ainda 'pendente'. Atômico no nível da
    // linha — se uma aprovação concorrente já mudou o status, casa 0 linhas e
    // NÃO sobrescreve (evita descartar um rascunho que já virou pedido).
    const afetadas = await this.db
      .update(pedidoRascunho)
      .set({ statusTriagem: "descartado", processadoEm: new Date() })
      .where(
        and(eq(pedidoRascunho.id, id), eq(pedidoRascunho.statusTriagem, "pendente")),
      )
      .returning({ id: pedidoRascunho.id });
    return afetadas.length > 0;
  }
}
