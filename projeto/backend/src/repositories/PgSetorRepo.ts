import { eq } from "drizzle-orm";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";
import type { Setor, NovoSetor } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { setor } from "../db/schema.js";

export class PgSetorRepo implements ISetorRepository {
  constructor(private db: DB = defaultDb) {}

  async criar(novo: NovoSetor): Promise<Setor> {
    const [criado] = await this.db.insert(setor).values(novo).returning();
    if (!criado) throw new Error("Falha ao criar setor");
    return criado;
  }

  async listar(): Promise<Setor[]> {
    return this.db.select().from(setor);
  }

  async buscarPorId(id: number): Promise<Setor | null> {
    const [achado] = await this.db.select().from(setor).where(eq(setor.id, id)).limit(1);
    return achado ?? null;
  }
}
