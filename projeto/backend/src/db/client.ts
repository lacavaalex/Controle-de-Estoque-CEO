// Cliente Drizzle/pg compartilhado. Config via dotenv (ADR-0003).
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Copie .env.example para .env (veja ADR-0003).",
  );
}

export const pool = new pg.Pool({
  connectionString,
  // Evita clientes ociosos eternos; o pool recria sob demanda.
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Clientes ociosos que perdem o link com o Postgres disparam 'error'. Sem
// listener isso derruba o processo Node depois de alguns minutos — sintoma:
// o front segue no ar mas toda chamada /api vira "Erro de conexão".
pool.on("error", (err) => {
  console.error("[pg] Erro inesperado em cliente ocioso do pool:", err);
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;

// Executor transacional (o argumento do callback de db.transaction). Compartilha
// a API de consulta com DB, mas não é o NodePgDatabase completo. Exportado para
// que repositórios componham uma transação única (ex.: promoção rascunhopedido).
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
