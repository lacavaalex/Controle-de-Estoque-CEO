import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, closePool } from "./connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

async function migrate(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const arquivos = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const arquivo of arquivos) {
      const { rowCount } = await client.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [arquivo]
      );
      if (rowCount && rowCount > 0) {
        console.log(`  ✓ já aplicada: ${arquivo}`);
        continue;
      }

      const sql = await readFile(join(MIGRATIONS_DIR, arquivo), "utf-8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [arquivo]);
        await client.query("COMMIT");
        console.log(`  ↑ aplicada: ${arquivo}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Falha na migration "${arquivo}": ${(err as Error).message}`);
      }
    }

    console.log("\nMigrations concluídas.");
  } finally {
    client.release();
    await closePool();
  }
}

migrate().catch((err) => {
  console.error("Erro nas migrations:", err.message);
  process.exit(1);
});
