// setup.js — configuração global dos testes (Vitest + Testing Library).
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Limpa o DOM e o localStorage entre testes para isolamento.
// (Não usamos restoreAllMocks/resetAllMocks aqui porque isso apagaria as
//  implementações de vi.mock(...) declaradas no topo de cada arquivo de teste;
//  cada arquivo já faz clearAllMocks no seu beforeEach quando precisa.)
afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});
