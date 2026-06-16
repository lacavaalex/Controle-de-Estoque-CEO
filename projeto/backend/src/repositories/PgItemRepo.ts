import { getPool } from "../database/connection.js";
import type { IItemRepository } from "../interfaces/repository-interfaces/IItemRepo.js";
import type { Item } from "../entities/Item.js";
import type { CategoriaItem } from "../entities/enums.js";

export class PgItemRepo implements IItemRepository {
  private get pool() {
    return getPool();
  }

  async findAll(filtros?: {
    nome?: string;
    lote?: string;
    categoria?: CategoriaItem;
  }): Promise<Item[]> {
    const condicoes: string[] = [];
    const valores: unknown[] = [];
    let i = 1;

    if (filtros?.nome) {
      condicoes.push(`nome ILIKE $${i++}`);
      valores.push(`%${filtros.nome}%`);
    }
    if (filtros?.lote) {
      condicoes.push(`lote ILIKE $${i++}`);
      valores.push(`%${filtros.lote}%`);
    }
    if (filtros?.categoria) {
      condicoes.push(`categoria = $${i++}`);
      valores.push(filtros.categoria);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
    const { rows } = await this.pool.query<Item>(
      `SELECT id, nome, categoria, lote, quantidade, unidade,
              estoque_minimo, estoque_maximo,
              TO_CHAR(validade, 'YYYY-MM-DD') AS validade,
              localizacao, fornecedor
       FROM item ${where}
       ORDER BY nome`,
      valores
    );
    return rows;
  }

  async findById(id: number): Promise<Item | null> {
    const { rows } = await this.pool.query<Item>(
      `SELECT id, nome, categoria, lote, quantidade, unidade,
              estoque_minimo, estoque_maximo,
              TO_CHAR(validade, 'YYYY-MM-DD') AS validade,
              localizacao, fornecedor
       FROM item WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(item: Omit<Item, "id">): Promise<Item> {
    const { rows } = await this.pool.query<Item>(
      `INSERT INTO item
         (nome, categoria, lote, quantidade, unidade,
          estoque_minimo, estoque_maximo, validade, localizacao, fornecedor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, nome, categoria, lote, quantidade, unidade,
                 estoque_minimo, estoque_maximo,
                 TO_CHAR(validade, 'YYYY-MM-DD') AS validade,
                 localizacao, fornecedor`,
      [
        item.nome, item.categoria, item.lote, item.quantidade, item.unidade,
        item.estoque_minimo, item.estoque_maximo, item.validade,
        item.localizacao, item.fornecedor,
      ]
    );
    return rows[0]!;
  }

  async update(id: number, dados: Partial<Omit<Item, "id">>): Promise<Item | null> {
    const campos = Object.keys(dados) as (keyof typeof dados)[];
    if (campos.length === 0) return this.findById(id);

    const sets = campos.map((c, idx) => `${c} = $${idx + 2}`).join(", ");
    const valores = [id, ...campos.map((c) => dados[c])];

    const { rows } = await this.pool.query<Item>(
      `UPDATE item SET ${sets} WHERE id = $1
       RETURNING id, nome, categoria, lote, quantidade, unidade,
                 estoque_minimo, estoque_maximo,
                 TO_CHAR(validade, 'YYYY-MM-DD') AS validade,
                 localizacao, fornecedor`,
      valores
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM item WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async findVencendo(dias: number): Promise<Item[]> {
    const { rows } = await this.pool.query<Item>(
      `SELECT id, nome, categoria, lote, quantidade, unidade,
              estoque_minimo, estoque_maximo,
              TO_CHAR(validade, 'YYYY-MM-DD') AS validade,
              localizacao, fornecedor
       FROM item
       WHERE validade BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::INT * INTERVAL '1 day'
       ORDER BY validade`,
      [dias]
    );
    return rows;
  }

  async findCriticos(): Promise<Item[]> {
    const { rows } = await this.pool.query<Item>(
      `SELECT id, nome, categoria, lote, quantidade, unidade,
              estoque_minimo, estoque_maximo,
              TO_CHAR(validade, 'YYYY-MM-DD') AS validade,
              localizacao, fornecedor
       FROM item
       WHERE quantidade <= estoque_minimo
       ORDER BY quantidade`
    );
    return rows;
  }
}
