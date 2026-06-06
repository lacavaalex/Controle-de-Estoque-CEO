// repositories/PgLoteRepo.ts
import { getPool } from "../database/connection.js";
import type { ILoteRepo } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { Lote } from "../entities/Lote.js";
import type { EstadoLote } from "../entities/enums.js";

export class PgLoteRepo implements ILoteRepo {
  private get pool() {
    return getPool();
  }

  // Cria lote
  async createLote(lote: Omit<Lote, "id" | "updated_at">): Promise<Lote> {
    const { rows } = await this.pool.query<Lote>(
      `INSERT INTO lotes
         (product_id, sector_id, lot_number, manufactured_at, expires_at,
          quantity, status, segregated_at, segregation_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        lote.product_id,
        lote.sector_id,
        lote.lot_number,
        lote.manufactured_at,
        lote.expires_at,
        lote.quantity,
        lote.status,
        lote.segregated_at,
        lote.segregation_note,
      ]
    );
    return rows[0]!;
  }

  // Deleta lote
  async deleteLote(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM lotes WHERE id = $1`,
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async updateLote(
    id: number,
    dados: Partial<Omit<Lote, "id" | "updated_at">>
  ): Promise<Lote | null> {
    const campos = Object.keys(dados) as (keyof typeof dados)[];
    if (campos.length === 0) return this.findLoteById(id);

    const sets = campos.map((c, idx) => `${c} = $${idx + 2}`).join(", ");
    const valores = [id, ...campos.map((c) => dados[c])];

    const { rows } = await this.pool.query<Lote>(
      `UPDATE lotes SET ${sets} WHERE id = $1 RETURNING *`,
      valores
    );
    return rows[0] ?? null;
  }

  // Encontra lote por id
  async findLoteById(id: number): Promise<Lote | null> {
    const { rows } = await this.pool.query<Lote>(
      `SELECT * FROM lotes WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  // Encontra todos lotes de um produto
  async getAllLotesByProduct(product_id: number): Promise<Lote[]> {
    const { rows } = await this.pool.query<Lote>(
      `SELECT * FROM lotes WHERE product_id = $1 ORDER BY expires_at`,
      [product_id]
    );
    return rows;
  }

  // Encontra Lotes expirando
  async findExpiringLotes(dias: number): Promise<Lote[]> {
    const { rows } = await this.pool.query<Lote>(
      `SELECT * FROM lotes
       WHERE expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
       ORDER BY expires_at`,
      [dias]
    );
    return rows;
  }
}