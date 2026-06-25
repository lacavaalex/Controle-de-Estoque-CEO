import { and, eq } from "drizzle-orm";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { Lote, NovoLote } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { lote, produto } from "../db/schema.js";

export class PgLoteRepo implements ILoteRepository {
  constructor(private db: DB = defaultDb) {}

  async criar(novo: NovoLote): Promise<Lote> {
    const [criado] = await this.db.insert(lote).values(novo).returning();
    if (!criado) throw new Error("Falha ao criar lote");
    return criado;
  }

  async buscarPorId(id: number): Promise<Lote | null> {
    const [achado] = await this.db.select().from(lote).where(eq(lote.id, id)).limit(1);
    return achado ?? null;
  }

  async listarPorProdutoSetor(produtoId: number, setorId: number): Promise<Lote[]> {
    return this.db
      .select()
      .from(lote)
      .where(and(eq(lote.produtoId, produtoId), eq(lote.setorId, setorId)));
  }

  async listarPorProdutoTodosSetores(produtoId: number): Promise<Lote[]> {
    return this.db.select().from(lote).where(eq(lote.produtoId, produtoId));
  }

  async listarPorSetor(setorId: number): Promise<Lote[]> {
    return this.db.select().from(lote).where(eq(lote.setorId, setorId));
  }

  async atualizar(id: number, props: Partial<Omit<Lote, "id">>): Promise<void> {
    await this.db.update(lote).set(props).where(eq(lote.id, id));
  }

  async listarSegregadosPorSetor(setorId: number): Promise<any[]> {
    return this.db
      .select({
        id: lote.id,
        numeroLote: lote.numeroLote,
        dataSegregacao: lote.dataSegregacao,
        quantidade: lote.quantidade,
        observacaoSegregacao: lote.observacaoSegregacao,
        produtoNome: produto.nome,
      })
      .from(lote)
      .innerJoin(produto, eq(lote.produtoId, produto.id))
      .where(and(eq(lote.setorId, setorId), eq(lote.estado, "segregado")));
  }
}
