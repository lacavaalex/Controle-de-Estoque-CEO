import { getPool } from "../database/connection.js";
import type { ISolicitacaoRepository } from "../interfaces/repository-interfaces/ISolicitacaoRepo.js";
import type { Solicitacao } from "../entities/Solicitacao.js";
import type { StatusSolicitacao } from "../entities/enums.js";

const COLUNAS = `
  id, item_id, item_nome, solicitante, cargo,
  data_solicitacao AT TIME ZONE 'UTC' AS data_solicitacao,
  quantidade_solicitada, unidade, justificativa, status,
  data_conclusao AT TIME ZONE 'UTC' AS data_conclusao,
  responsavel, observacao
`;

export class PgSolicitacaoRepo implements ISolicitacaoRepository {
  private get pool() {
    return getPool();
  }

  async findAll(filtros?: {
    status?: StatusSolicitacao;
    solicitante?: string;
  }): Promise<Solicitacao[]> {
    const condicoes: string[] = [];
    const valores: unknown[] = [];
    let i = 1;

    if (filtros?.status) {
      condicoes.push(`status = $${i++}`);
      valores.push(filtros.status);
    }
    if (filtros?.solicitante) {
      condicoes.push(`solicitante = $${i++}`);
      valores.push(filtros.solicitante);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
    const { rows } = await this.pool.query<Solicitacao>(
      `SELECT ${COLUNAS} FROM solicitacao ${where} ORDER BY data_solicitacao DESC`,
      valores
    );
    return rows;
  }

  async findById(id: string): Promise<Solicitacao | null> {
    const { rows } = await this.pool.query<Solicitacao>(
      `SELECT ${COLUNAS} FROM solicitacao WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(sol: Omit<Solicitacao, "status" | "data_conclusao" | "responsavel" | "observacao">): Promise<Solicitacao> {
    const { rows } = await this.pool.query<Solicitacao>(
      `INSERT INTO solicitacao
         (id, item_id, item_nome, solicitante, cargo,
          quantidade_solicitada, unidade, justificativa)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${COLUNAS}`,
      [
        sol.id, sol.item_id, sol.item_nome, sol.solicitante, sol.cargo,
        sol.quantidade_solicitada, sol.unidade, sol.justificativa,
      ]
    );
    return rows[0]!;
  }

  async aprovar(id: string, responsavel: string): Promise<Solicitacao | null> {
    const { rows } = await this.pool.query<Solicitacao>(
      `UPDATE solicitacao
       SET status = 'aprovada', data_conclusao = NOW(), responsavel = $2
       WHERE id = $1 AND status = 'pendente'
       RETURNING ${COLUNAS}`,
      [id, responsavel]
    );
    return rows[0] ?? null;
  }

  async negar(id: string, responsavel: string, observacao: string): Promise<Solicitacao | null> {
    const { rows } = await this.pool.query<Solicitacao>(
      `UPDATE solicitacao
       SET status = 'negada', data_conclusao = NOW(),
           responsavel = $2, observacao = $3
       WHERE id = $1 AND status = 'pendente'
       RETURNING ${COLUNAS}`,
      [id, responsavel, observacao]
    );
    return rows[0] ?? null;
  }

  async getNextId(): Promise<string> {
    const { rows } = await this.pool.query<{ max_num: number }>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS INT)), 0) AS max_num
       FROM solicitacao`
    );
    const proximo = (rows[0]?.max_num ?? 0) + 1;
    return `SOL-${String(proximo).padStart(3, "0")}`;
  }
}
