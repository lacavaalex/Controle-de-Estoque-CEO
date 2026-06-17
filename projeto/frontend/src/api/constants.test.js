import { describe, it, expect } from "vitest";
import {
  STATUS_ESTOQUE, STATUS_CLASS, STATUS_PEDIDO, STATUS_PEDIDO_CLASS,
  ROTULO_STATUS, CATEGORIAS, UNIDADES, PERFIL,
} from "./constants.js";

describe("mapas de status de estoque", () => {
  it("todo status de estoque tem classe CSS", () => {
    for (const s of STATUS_ESTOQUE) {
      expect(STATUS_CLASS[s], `falta classe para ${s}`).toBeTruthy();
    }
  });
  it("Vencido usa a classe forte", () => {
    expect(STATUS_CLASS["Vencido"]).toBe("st-vencido");
  });
});

describe("mapas de status de pedido", () => {
  it("todo status de pedido tem classe e rótulo", () => {
    for (const s of STATUS_PEDIDO) {
      expect(STATUS_PEDIDO_CLASS[s], `falta classe para ${s}`).toBeTruthy();
      expect(ROTULO_STATUS[s], `falta rótulo para ${s}`).toBeTruthy();
    }
  });
});

describe("enums do contrato", () => {
  it("categorias e unidades não estão vazias", () => {
    expect(CATEGORIAS.length).toBeGreaterThan(0);
    expect(UNIDADES).toContain("unidade");
    expect(UNIDADES).toContain("frasco");
  });
  it("perfis chave existem", () => {
    expect(PERFIL).toMatchObject({
      GESTOR: "gestor", ALMOXARIFE: "almoxarife", SOLICITANTE: "solicitante",
    });
  });
});
