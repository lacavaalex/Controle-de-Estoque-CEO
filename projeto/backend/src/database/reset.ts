import { spawn } from "node:child_process";
import { getPool, closePool } from "./connection.js";

async function reset(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("reset.ts não pode rodar em produção.");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log("Resetando banco de dados...");
    await client.query(`
      TRUNCATE TABLE movimentacoes, itens_pedido, pedidos, lotes, produtos, usuarios, setores
      RESTART IDENTITY CASCADE
    `);
    console.log("  ✓ tabelas truncadas.");
  } finally {
    client.release();
    await closePool();
  }

  console.log("\nExecutando seeds...");
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("npx", ["tsx", "src/database/seed.ts"], {
      stdio: "inherit",
      shell: true,
      cwd: process.cwd(),
    });
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`seed.ts saiu com código ${code}`))
    );
  });
}

reset().catch((err) => {
  console.error("Erro no reset:", err.message);
  process.exit(1);
});
