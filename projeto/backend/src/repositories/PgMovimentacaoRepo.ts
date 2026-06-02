import { getPool } from "../database/connection.js";
import type { IMovimentacaoRepository } from "../interfaces/repository-interfaces/IMovimentacaoRepo.js";
import type { Movimentacao } from "../entities/Movimentacao.js";

const COLUNAS = `
  id, tipo, item_id, item_nome, quantidade, unidade, origem, destino,
  responsavel, data AT TIME ZONE 'UTC' AS data, solicitacao_id
`;

export class PgMovimentacaoRepo implements IMovimentacaoRepository {
  private get pool() {
    return getPool();
  }

  async findRecent(limite = 10): Promise<Movimentacao[]> {
    const { rows } = await this.pool.query<Movimentacao>(
      `SELECT ${COLUNAS} FROM movimentacao ORDER BY data DESC LIMIT $1`,
      [limite]
    );
    return rows;
  }

  async findAll(): Promise<Movimentacao[]> {
    const { rows } = await this.pool.query<Movimentacao>(
      `SELECT ${COLUNAS} FROM movimentacao ORDER BY data DESC`
    );
    return rows;
  }

  async findById(id: string): Promise<Movimentacao | null> {
    const { rows } = await this.pool.query<Movimentacao>(
      `SELECT ${COLUNAS} FROM movimentacao WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(mov: Omit<Movimentacao, "data">): Promise<Movimentacao> {
    const { rows } = await this.pool.query<Movimentacao>(
      `INSERT INTO movimentacao
         (id, tipo, item_id, item_nome, quantidade, unidade,
          origem, destino, responsavel, solicitacao_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING ${COLUNAS}`,
      [
        mov.id, mov.tipo, mov.item_id, mov.item_nome, mov.quantidade,
        mov.unidade, mov.origem, mov.destino, mov.responsavel,
        mov.solicitacao_id,
      ]
    );
    return rows[0]!;
  }

  async getNextId(): Promise<string> {
    const { rows } = await this.pool.query<{ max_num: number }>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS INT)), 0) AS max_num
       FROM movimentacao`
    );
    const proximo = (rows[0]?.max_num ?? 0) + 1;
    return `MOV-${String(proximo).padStart(3, "0")}`;
  }
}
