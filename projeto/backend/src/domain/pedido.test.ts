import { describe, it, expect } from "vitest";
import type { StatusItem } from "../entities/index.js";
import { statusDerivadoDoPedido } from "./pedido.js";

describe("statusDerivadoDoPedido (RN10)", () => {
  it("lança erro com lista vazia (RN09)", () => {
    expect(() => statusDerivadoDoPedido([])).toThrow();
  });

  it("pendente quando todos pendentes", () => {
    expect(statusDerivadoDoPedido(["pendente", "pendente"])).toBe("pendente");
  });

  it("pendente quando mistura pendente + aguardando_reposicao", () => {
    expect(statusDerivadoDoPedido(["pendente", "aguardando_reposicao"])).toBe("pendente");
  });

  it("aguardando_reposicao quando todos aguardando", () => {
    expect(statusDerivadoDoPedido(["aguardando_reposicao", "aguardando_reposicao"])).toBe(
      "aguardando_reposicao",
    );
  });

  it("em_processamento quando há processado + pendente", () => {
    const itens: StatusItem[] = ["atendido_integral", "pendente"];
    expect(statusDerivadoDoPedido(itens)).toBe("em_processamento");
  });

  it("atendido_integral quando todos integrais", () => {
    expect(statusDerivadoDoPedido(["atendido_integral", "atendido_integral"])).toBe(
      "atendido_integral",
    );
  });

  it("atendido_parcial: todos processados, com parcial e integral", () => {
    expect(statusDerivadoDoPedido(["atendido_integral", "atendido_parcial"])).toBe(
      "atendido_parcial",
    );
  });

  it("atendido_parcial: integral + nao_atendido (algo saiu)", () => {
    expect(statusDerivadoDoPedido(["atendido_integral", "nao_atendido"])).toBe(
      "atendido_parcial",
    );
  });

  it("nao_atendido: todos nao_atendido", () => {
    expect(statusDerivadoDoPedido(["nao_atendido", "nao_atendido"])).toBe("nao_atendido");
  });

  it("nao_atendido: mistura nao_atendido + aguardando (nada saiu)", () => {
    expect(statusDerivadoDoPedido(["nao_atendido", "aguardando_reposicao"])).toBe(
      "nao_atendido",
    );
  });
});
