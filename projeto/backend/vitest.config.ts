import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Escopa os testes apenas às fontes em src/ — evita pegar o teste compilado
    // em dist/ (que compartilha estado entre testes e gera falha falsa).
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
  },
});
