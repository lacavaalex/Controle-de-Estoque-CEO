import { getPool } from "../database/connection.js";
import type { IEstoqueCeoRepository } from "../interfaces/repository-interfaces/IEstoqueCeoRepo.js";
import type { EstoqueCeo } from "../entities/EstoqueCeo.js";

const COLUNAS = "id, item_id, nome, categoria, quantidade, unidade, estoque_minimo";

export class PgEstoqueCeoRepo implements IEstoqueCeoRepository {
  private get pool() {
    return getPool();
  }

  async findAll(): Promise<EstoqueCeo[]> {
    const { rows } = await this.pool.query<EstoqueCeo>(
      `SELECT ${COLUNAS} FROM estoque_ceo ORDER BY nome`
    );
    return rows;
  }

  async findByItemId(item_id: number): Promise<EstoqueCeo | null> {
    const { rows } = await this.pool.query<EstoqueCeo>(
      `SELECT ${COLUNAS} FROM estoque_ceo WHERE item_id = $1`,
      [item_id]
    );
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<EstoqueCeo | null> {
    const { rows } = await this.pool.query<EstoqueCeo>(
      `SELECT ${COLUNAS} FROM estoque_ceo WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(entrada: Omit<EstoqueCeo, "id">): Promise<EstoqueCeo> {
    const { rows } = await this.pool.query<EstoqueCeo>(
      `INSERT INTO estoque_ceo (item_id, nome, categoria, quantidade, unidade, estoque_minimo)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING ${COLUNAS}`,
      [
        entrada.item_id, entrada.nome, entrada.categoria,
        entrada.quantidade, entrada.unidade, entrada.estoque_minimo,
      ]
    );
    return rows[0]!;
  }

  async updateQuantidade(item_id: number, delta: number): Promise<EstoqueCeo | null> {
    const { rows } = await this.pool.query<EstoqueCeo>(
      `UPDATE estoque_ceo
       SET quantidade = quantidade + $2
       WHERE item_id = $1 AND quantidade + $2 >= 0
       RETURNING ${COLUNAS}`,
      [item_id, delta]
    );
    return rows[0] ?? null;
  }

  async update(
    id: number,
    dados: Partial<Omit<EstoqueCeo, "id" | "item_id">>
  ): Promise<EstoqueCeo | null> {
    const campos = Object.keys(dados) as (keyof typeof dados)[];
    if (campos.length === 0) return this.findById(id);

    const sets = campos.map((c, idx) => `${c} = $${idx + 2}`).join(", ");
    const valores = [id, ...campos.map((c) => dados[c])];

    const { rows } = await this.pool.query<EstoqueCeo>(
      `UPDATE estoque_ceo SET ${sets} WHERE id = $1 RETURNING ${COLUNAS}`,
      valores
    );
    return rows[0] ?? null;
  }
}
