import { eq, or, sql } from "drizzle-orm";
import type {
  IMovimentacaoRepository,
  NovaMovimentacaoSemId,
} from "../interfaces/repository-interfaces/IMovimentacaoRepo.js";
import type { Movimentacao } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { movimentacao } from "../db/schema.js";

export class PgMovimentacaoRepo implements IMovimentacaoRepository {
  constructor(private db: DB = defaultDb) {}

  // Próximo id formatado MOV-NNN a partir da sequência (lpad com 3 dígitos,
  // crescendo além disso naturalmente). Aceita um executor para participar de
  // transações (db.transaction(tx => ...)).
  private async proximoId(executor: DB = this.db): Promise<string> {
    // O driver pg devolve QueryResult; as linhas ficam em `.rows`.
    const resultado = await executor.execute<{ id: string }>(
      sql`SELECT 'MOV-' || lpad(nextval('seq_movimentacao')::text, 3, '0') AS id`,
    );
    const row = resultado.rows[0];
    if (!row) throw new Error("Falha ao gerar id da movimentação");
    return row.id;
  }

  async registrar(mov: NovaMovimentacaoSemId): Promise<Movimentacao> {
    // Se o chamador passou um executor de transação em mov, não há campo para
    // isso na interface; transações são orquestradas pelo service via db.transaction
    // chamando este repo com uma instância ligada à tx (ver LoteService).
    const id = await this.proximoId();
    const [criada] = await this.db
      .insert(movimentacao)
      .values({ ...mov, id })
      .returning();
    if (!criada) throw new Error("Falha ao registrar movimentação");
    return criada;
  }

  async buscarPorId(id: string): Promise<Movimentacao | null> {
    const [achada] = await this.db
      .select()
      .from(movimentacao)
      .where(eq(movimentacao.id, id))
      .limit(1);
    return achada ?? null;
  }

  async listarPorLote(loteId: number): Promise<Movimentacao[]> {
    return this.db.select().from(movimentacao).where(eq(movimentacao.loteId, loteId));
  }

  async listarPorSetor(setorId: number): Promise<Movimentacao[]> {
    return this.db
      .select()
      .from(movimentacao)
      .where(
        or(
          eq(movimentacao.setorOrigemId, setorId),
          eq(movimentacao.setorDestinoId, setorId),
        ),
      );
  }
}
