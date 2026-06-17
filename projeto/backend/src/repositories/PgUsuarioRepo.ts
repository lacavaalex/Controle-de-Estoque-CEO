import { eq } from "drizzle-orm";
import type { IUsuarioRepository } from "../interfaces/repository-interfaces/IUsuarioRepo.js";
import type { Usuario, NovoUsuario } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { usuario } from "../db/schema.js";

export class PgUsuarioRepo implements IUsuarioRepository {
  constructor(private db: DB = defaultDb) {}

  async criar(novo: NovoUsuario): Promise<Usuario> {
    const [criado] = await this.db.insert(usuario).values(novo).returning();
    if (!criado) throw new Error("Falha ao criar usuário");
    return criado;
  }

  async listar(): Promise<Usuario[]> {
    return this.db.select().from(usuario);
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const [achado] = await this.db.select().from(usuario).where(eq(usuario.id, id)).limit(1);
    return achado ?? null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const [achado] = await this.db.select().from(usuario).where(eq(usuario.email, email)).limit(1);
    return achado ?? null;
  }

  async atualizar(id: number, props: Partial<Omit<Usuario, "id">>): Promise<void> {
    await this.db.update(usuario).set(props).where(eq(usuario.id, id));
  }
}
