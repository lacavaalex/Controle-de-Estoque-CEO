import { describe, it, expect } from "vitest";
import type { Lote, Produto } from "../entities/index.js";
import {
  diasParaVencer,
  estadoValidadeLote,
  qtdTotal,
  loteEhExpedivel,
  ordenarFEFO,
  statusProduto,
  exigeReposicao,
  exigeAtencaoValidade,
  compararSeveridade,
} from "./estoque.js";

// Data fixa de referência para testes determinísticos.
const HOJE = new Date("2026-06-02T12:00:00Z");

// Helpers para construir entidades de teste com defaults sensatos.
function mkProduto(over: Partial<Produto> = {}): Produto {
  return {
    id: 1,
    nome: "Produto Teste",
    categoria: "EPI",
    unidade: "caixa",
    estoqueMinimo: 10,
    estoqueMaximo: 100,
    localizacao: null,
    fornecedor: null,
    ...over,
  };
}

let loteSeq = 0;
function mkLote(over: Partial<Lote> = {}): Lote {
  loteSeq += 1;
  return {
    id: loteSeq,
    produtoId: 1,
    setorId: 1,
    numeroLote: `LT-${loteSeq}`,
    fabricacao: null,
    validade: "2027-01-01",
    quantidade: 50,
    estado: "ativo",
    dataSegregacao: null,
    observacaoSegregacao: null,
    ...over,
  };
}

// Validade a N dias de HOJE.
function validadeEmDias(dias: number): string {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

describe("diasParaVencer", () => {
  it("retorna negativo para validade passada", () => {
    expect(diasParaVencer(validadeEmDias(-5), HOJE)).toBe(-5);
  });
  it("retorna positivo para validade futura", () => {
    expect(diasParaVencer(validadeEmDias(40), HOJE)).toBe(40);
  });
});

describe("estadoValidadeLote (RN05)", () => {
  it("vencido quando dias <= 0", () => {
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(0) }), HOJE)).toBe("vencido");
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(-1) }), HOJE)).toBe("vencido");
  });
  it("vencendo quando 0 < dias <= 30", () => {
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(1) }), HOJE)).toBe("vencendo");
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(30) }), HOJE)).toBe("vencendo");
  });
  it("atencao quando 30 < dias <= 60", () => {
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(31) }), HOJE)).toBe("atencao");
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(60) }), HOJE)).toBe("atencao");
  });
  it("ok quando dias > 60", () => {
    expect(estadoValidadeLote(mkLote({ validade: validadeEmDias(61) }), HOJE)).toBe("ok");
  });
});

describe("qtdTotal (RN07)", () => {
  it("soma apenas lotes ativos", () => {
    const lotes = [
      mkLote({ quantidade: 10, estado: "ativo" }),
      mkLote({ quantidade: 20, estado: "ativo" }),
      mkLote({ quantidade: 100, estado: "vencido" }),
      mkLote({ quantidade: 100, estado: "segregado", dataSegregacao: validadeEmDias(-1) }),
    ];
    expect(qtdTotal(lotes)).toBe(30);
  });
  it("retorna 0 sem lotes ativos", () => {
    expect(qtdTotal([mkLote({ estado: "vencido" })])).toBe(0);
  });
});

describe("loteEhExpedivel / FEFO (RN20, INV08)", () => {
  it("exclui vencido, segregado e quantidade 0", () => {
    expect(loteEhExpedivel(mkLote({ estado: "vencido" }), HOJE)).toBe(false);
    expect(loteEhExpedivel(mkLote({ estado: "segregado", dataSegregacao: validadeEmDias(-1) }), HOJE)).toBe(false);
    expect(loteEhExpedivel(mkLote({ quantidade: 0 }), HOJE)).toBe(false);
    // ativo mas validade já passou (estado não atualizado) também não é expedível
    expect(loteEhExpedivel(mkLote({ validade: validadeEmDias(-1) }), HOJE)).toBe(false);
    expect(loteEhExpedivel(mkLote({ validade: validadeEmDias(10) }), HOJE)).toBe(true);
  });
  it("ordena por validade mais próxima primeiro e remove não-expedíveis", () => {
    const longe = mkLote({ validade: validadeEmDias(200) });
    const perto = mkLote({ validade: validadeEmDias(10) });
    const medio = mkLote({ validade: validadeEmDias(90) });
    const vencido = mkLote({ validade: validadeEmDias(-3) });
    const ordenados = ordenarFEFO([longe, perto, medio, vencido], HOJE);
    expect(ordenados.map((l) => l.id)).toEqual([perto.id, medio.id, longe.id]);
  });
});

describe("statusProduto (RN03–RN06)", () => {
  it("indisponível quando qtd_total = 0", () => {
    const p = mkProduto();
    expect(statusProduto(p, [mkLote({ estado: "vencido" })], { hoje: HOJE })).toBe("indisponivel");
  });

  it("vencido tem precedência sobre quantidade (RN06)", () => {
    const p = mkProduto({ estoqueMinimo: 10 });
    const lotes = [
      mkLote({ quantidade: 5, validade: validadeEmDias(-1) }), // ativo mas vencido por data
      mkLote({ quantidade: 5, validade: validadeEmDias(300) }),
    ];
    expect(statusProduto(p, lotes, { hoje: HOJE })).toBe("vencido");
  });

  it("vencendo antes de crítico", () => {
    const p = mkProduto({ estoqueMinimo: 100 });
    const lotes = [mkLote({ quantidade: 5, validade: validadeEmDias(10) })];
    expect(statusProduto(p, lotes, { hoje: HOJE })).toBe("vencendo");
  });

  it("atenção (31–60d) antes de crítico", () => {
    const p = mkProduto({ estoqueMinimo: 100 });
    const lotes = [mkLote({ quantidade: 5, validade: validadeEmDias(45) })];
    expect(statusProduto(p, lotes, { hoje: HOJE })).toBe("atencao");
  });

  it("crítico quando qtd_total <= mínimo (validade longe)", () => {
    const p = mkProduto({ estoqueMinimo: 10 });
    const lotes = [mkLote({ quantidade: 10, validade: validadeEmDias(300) })];
    expect(statusProduto(p, lotes, { hoje: HOJE })).toBe("critico");
  });

  it("baixo quando qtd_total <= mínimo * 1.5", () => {
    const p = mkProduto({ estoqueMinimo: 10 });
    const lotes = [mkLote({ quantidade: 15, validade: validadeEmDias(300) })];
    expect(statusProduto(p, lotes, { hoje: HOJE })).toBe("baixo");
  });

  it("excessivo (>= máximo * 0.95) só quando incluirExcessivo", () => {
    const p = mkProduto({ estoqueMinimo: 10, estoqueMaximo: 100 });
    const lotes = [mkLote({ quantidade: 96, validade: validadeEmDias(300) })];
    expect(statusProduto(p, lotes, { hoje: HOJE, incluirExcessivo: true })).toBe("excessivo");
    // No CEO (incluirExcessivo=false) o mesmo estoque é Normal.
    expect(statusProduto(p, lotes, { hoje: HOJE, incluirExcessivo: false })).toBe("normal");
  });

  it("normal no caso geral", () => {
    const p = mkProduto({ estoqueMinimo: 10, estoqueMaximo: 100 });
    const lotes = [mkLote({ quantidade: 50, validade: validadeEmDias(300) })];
    expect(statusProduto(p, lotes, { hoje: HOJE })).toBe("normal");
  });

  it("Equipamento (RN02) é isento de crítico/baixo/excessivo", () => {
    const equip = mkProduto({ categoria: "Equipamento", estoqueMinimo: 10, estoqueMaximo: 5 });
    // qtd baixíssima: seria crítico se fosse consumível, mas é Equipamento.
    const lotes = [mkLote({ quantidade: 1, validade: validadeEmDias(300) })];
    expect(statusProduto(equip, lotes, { hoje: HOJE })).toBe("normal");
    // mas ainda fica indisponível se zerar.
    expect(statusProduto(equip, [mkLote({ estado: "vencido" })], { hoje: HOJE })).toBe("indisponivel");
    // e validade ainda vale para Equipamento.
    expect(statusProduto(equip, [mkLote({ quantidade: 1, validade: validadeEmDias(10) })], { hoje: HOJE })).toBe("vencendo");
  });
});

// ─── CEO-250 — classificação de alertas (vencendo / crítico) ─────────────────
describe("exigeReposicao (CEO-250)", () => {
  it("é true para indisponível, crítico e baixo", () => {
    expect(exigeReposicao("indisponivel")).toBe(true);
    expect(exigeReposicao("critico")).toBe(true);
    expect(exigeReposicao("baixo")).toBe(true);
  });
  it("é false para status sem problema de saldo", () => {
    expect(exigeReposicao("normal")).toBe(false);
    expect(exigeReposicao("excessivo")).toBe(false);
    expect(exigeReposicao("vencendo")).toBe(false);
    expect(exigeReposicao("vencido")).toBe(false);
    expect(exigeReposicao("atencao")).toBe(false);
  });
});

describe("exigeAtencaoValidade (CEO-250)", () => {
  it("é true para vencido, vencendo e atenção", () => {
    expect(exigeAtencaoValidade("vencido")).toBe(true);
    expect(exigeAtencaoValidade("vencendo")).toBe(true);
    expect(exigeAtencaoValidade("atencao")).toBe(true);
  });
  it("é false para status sem alerta de validade", () => {
    expect(exigeAtencaoValidade("normal")).toBe(false);
    expect(exigeAtencaoValidade("critico")).toBe(false);
    expect(exigeAtencaoValidade("baixo")).toBe(false);
    expect(exigeAtencaoValidade("indisponivel")).toBe(false);
    expect(exigeAtencaoValidade("excessivo")).toBe(false);
  });
});

describe("compararSeveridade (CEO-250)", () => {
  it("ordena do mais urgente para o menos urgente", () => {
    const desordenado = ["normal", "vencido", "baixo", "indisponivel", "vencendo", "critico"] as const;
    const ordenado = [...desordenado].sort(compararSeveridade);
    expect(ordenado).toEqual([
      "indisponivel",
      "vencido",
      "vencendo",
      "critico",
      "baixo",
      "normal",
    ]);
  });
  it("indisponível é sempre o mais urgente", () => {
    expect(compararSeveridade("indisponivel", "vencido")).toBeLessThan(0);
    expect(compararSeveridade("indisponivel", "critico")).toBeLessThan(0);
  });
});
