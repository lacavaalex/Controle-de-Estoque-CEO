import { getPool } from "../database/connection.js";
import type { IUsuarioRepository } from "../interfaces/repository-interfaces/IUsuarioRepo.js";
import type { Usuario } from "../entities/Usuario.js";

const COLUNAS = "id, nome, email, senha_hash, cargo, role, unidade, avatar";

export class PgUsuarioRepo implements IUsuarioRepository {
  private get pool() {
    return getPool();
  }

  async findById(id: number): Promise<Usuario | null> {
    const { rows } = await this.pool.query<Usuario>(
      `SELECT ${COLUNAS} FROM usuario WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<Usuario>(
      `SELECT ${COLUNAS} FROM usuario WHERE email = $1`,
      [email]
    );
    return rows[0] ?? null;
  }

  async findAll(): Promise<Usuario[]> {
    const { rows } = await this.pool.query<Usuario>(
      `SELECT ${COLUNAS} FROM usuario ORDER BY nome`
    );
    return rows;
  }

  async create(usuario: Omit<Usuario, "id">): Promise<Usuario> {
    const { rows } = await this.pool.query<Usuario>(
      `INSERT INTO usuario (nome, email, senha_hash, cargo, role, unidade, avatar)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING ${COLUNAS}`,
      [
        usuario.nome, usuario.email, usuario.senha_hash,
        usuario.cargo, usuario.role, usuario.unidade, usuario.avatar,
      ]
    );
    return rows[0]!;
  }

  async update(id: number, dados: Partial<Omit<Usuario, "id">>): Promise<Usuario | null> {
    const campos = Object.keys(dados) as (keyof typeof dados)[];
    if (campos.length === 0) return this.findById(id);

    const sets = campos.map((c, idx) => `${c} = $${idx + 2}`).join(", ");
    const valores = [id, ...campos.map((c) => dados[c])];

    const { rows } = await this.pool.query<Usuario>(
      `UPDATE usuario SET ${sets} WHERE id = $1 RETURNING ${COLUNAS}`,
      valores
    );
    return rows[0] ?? null;
  }
}
