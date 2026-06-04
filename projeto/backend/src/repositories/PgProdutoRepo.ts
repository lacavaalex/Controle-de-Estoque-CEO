import { eq } from "drizzle-orm";
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { Produto, NovoProduto } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { produto } from "../db/schema.js";

export class PgProdutoRepo implements IProdutoRepository {
  constructor(private db: DB = defaultDb) {}

  async criar(novo: NovoProduto): Promise<Produto> {
    const [criado] = await this.db.insert(produto).values(novo).returning();
    if (!criado) throw new Error("Falha ao criar produto");
    return criado;
  }

  async listar(): Promise<Produto[]> {
    return this.db.select().from(produto);
  }

  async buscarPorId(id: number): Promise<Produto | null> {
    const [achado] = await this.db.select().from(produto).where(eq(produto.id, id)).limit(1);
    return achado ?? null;
  }

  async buscarPorNome(nome: string): Promise<Produto | null> {
    const [achado] = await this.db.select().from(produto).where(eq(produto.nome, nome)).limit(1);
    return achado ?? null;
  }

  async atualizar(id: number, props: Partial<Omit<Produto, "id">>): Promise<void> {
    await this.db.update(produto).set(props).where(eq(produto.id, id));
  }

  async remover(id: number): Promise<void> {
    await this.db.delete(produto).where(eq(produto.id, id));
  }
}
