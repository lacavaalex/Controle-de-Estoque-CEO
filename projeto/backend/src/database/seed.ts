import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, closePool } from "./connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = join(__dirname, "seeds");

async function seed(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const { rows } = await client.query("SELECT COUNT(*) AS total FROM setores");
    if (parseInt(rows[0].total, 10) > 0) {
      console.log("Seed ignorado: tabelas já possuem dados.");
      return;
    }

    const arquivos = (await readdir(SEEDS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const arquivo of arquivos) {
      const sql = await readFile(join(SEEDS_DIR, arquivo), "utf-8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`  ↑ seed aplicado: ${arquivo}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Falha no seed "${arquivo}": ${(err as Error).message}`);
      }
    }

    console.log("\nSeeds concluídos.");
  } finally {
    client.release();
    await closePool();
  }
}

seed().catch((err) => {
  console.error("Erro nos seeds:", err.message);
  process.exit(1);
});
