// Config do drizzle-kit (geração e aplicação de migrations) — ADR-0004.
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://ceo:ceo@localhost:5433/ceo_estoque",
  },
  verbose: true,
  strict: true,
});
