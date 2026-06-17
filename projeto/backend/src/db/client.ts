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

export const pool = new pg.Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
