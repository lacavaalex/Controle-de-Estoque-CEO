import { describe, it, expect } from "vitest";
import {
  calcularStatusItemDispensacao,
  calcularStatusEstoqueCeo,
} from "../utils/statusCalculator.js";

function diasApartirDeHoje(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function itemBase(overrides: Record<string, unknown> = {}) {
  return {
    quantidade: 50,
    estoque_minimo: 10,
    estoque_maximo: 100,
    validade: diasApartirDeHoje(90),
    ...overrides,
  };
}

describe("calcularStatusItemDispensacao", () => {
  it("retorna Vencido quando a validade já passou", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ validade: diasApartirDeHoje(-1) }))
    ).toBe("Vencido");
  });

  it("retorna Vencido quando a validade é hoje", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ validade: diasApartirDeHoje(0) }))
    ).toBe("Vencido");
  });

  it("retorna Vencendo com validade em 1 dia", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ validade: diasApartirDeHoje(1) }))
    ).toBe("Vencendo");
  });

  it("retorna Vencendo com validade em 30 dias (limite exato)", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ validade: diasApartirDeHoje(30) }))
    ).toBe("Vencendo");
  });

  it("retorna Atenção com validade em 31 dias", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ validade: diasApartirDeHoje(31) }))
    ).toBe("Atenção");
  });

  it("retorna Atenção com validade em 60 dias (limite exato)", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ validade: diasApartirDeHoje(60) }))
    ).toBe("Atenção");
  });

  it("retorna Crítico quando quantidade igual ao mínimo", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ quantidade: 10, estoque_minimo: 10 }))
    ).toBe("Crítico");
  });

  it("retorna Crítico quando quantidade abaixo do mínimo", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ quantidade: 3, estoque_minimo: 10 }))
    ).toBe("Crítico");
  });

  it("retorna Baixo quando quantidade está entre mínimo e mínimo×1.5", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ quantidade: 14, estoque_minimo: 10 }))
    ).toBe("Baixo");
  });

  it("retorna Excessivo quando quantidade >= máximo × 0.95", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ quantidade: 96, estoque_maximo: 100 }))
    ).toBe("Excessivo");
  });

  it("retorna Normal para item sem nenhum alerta", () => {
    expect(calcularStatusItemDispensacao(itemBase())).toBe("Normal");
  });

  it("validade expirada prevalece sobre estoque normal", () => {
    expect(
      calcularStatusItemDispensacao(itemBase({ quantidade: 80, validade: diasApartirDeHoje(-5) }))
    ).toBe("Vencido");
  });
});

describe("calcularStatusEstoqueCeo", () => {
  it("retorna Indisponível quando quantidade é 0", () => {
    expect(calcularStatusEstoqueCeo({ quantidade: 0, estoque_minimo: 5 })).toBe("Indisponível");
  });

  it("retorna Crítico quando quantidade igual ao mínimo", () => {
    expect(calcularStatusEstoqueCeo({ quantidade: 5, estoque_minimo: 5 })).toBe("Crítico");
  });

  it("retorna Crítico quando quantidade abaixo do mínimo e maior que 0", () => {
    expect(calcularStatusEstoqueCeo({ quantidade: 2, estoque_minimo: 5 })).toBe("Crítico");
  });

  it("retorna Baixo quando quantidade está entre mínimo e mínimo×2", () => {
    expect(calcularStatusEstoqueCeo({ quantidade: 8, estoque_minimo: 5 })).toBe("Baixo");
  });

  it("retorna Disponível quando quantidade supera mínimo×2", () => {
    expect(calcularStatusEstoqueCeo({ quantidade: 11, estoque_minimo: 5 })).toBe("Disponível");
  });
});
