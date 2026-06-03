import { describe, it, expect } from "vitest";
import type { Lote, StatusItem } from "../entities/index.js";
import { planejarExpedicaoItem, statusDerivadoDoPedido } from "./pedido.js";

// Helper: lote mínimo para os testes de expedição (só os campos usados pelo domínio).
function lote(props: Partial<Lote> & Pick<Lote, "id" | "quantidade" | "validade">): Lote {
  return {
    produtoId: 1,
    setorId: 1,
    numeroLote: `L-${props.id}`,
    fabricacao: null,
    estado: "ativo",
    dataSegregacao: null,
    observacaoSegregacao: null,
    ...props,
  } as Lote;
}

// Data fixa para validade determinística.
const HOJE = new Date("2026-06-03T12:00:00Z");
const FUTURO = "2027-01-01"; // bem longe, não vence

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

describe("planejarExpedicaoItem (RN16/RN19/RN20)", () => {
  it("lança erro com quantidade < 1 (RN09)", () => {
    expect(() => planejarExpedicaoItem(0, [])).toThrow();
  });

  it("atendido_integral de um único lote com saldo de sobra", () => {
    const lotes = [lote({ id: 1, quantidade: 10, validade: FUTURO })];
    const plano = planejarExpedicaoItem(4, lotes, HOJE);
    expect(plano.qtdExpedida).toBe(4);
    expect(plano.statusItem).toBe("atendido_integral");
    expect(plano.motivoDivergencia).toBeUndefined();
    expect(plano.alocacoes).toEqual([{ loteId: 1, quantidade: 4 }]);
  });

  it("consome lotes em ordem FEFO (validade mais próxima primeiro)", () => {
    const lotes = [
      lote({ id: 1, quantidade: 5, validade: "2027-06-01" }), // vence depois
      lote({ id: 2, quantidade: 5, validade: "2026-08-01" }), // vence antes -> primeiro
    ];
    const plano = planejarExpedicaoItem(7, lotes, HOJE);
    expect(plano.qtdExpedida).toBe(7);
    expect(plano.statusItem).toBe("atendido_integral");
    // 5 do lote 2 (FEFO) + 2 do lote 1.
    expect(plano.alocacoes).toEqual([
      { loteId: 2, quantidade: 5 },
      { loteId: 1, quantidade: 2 },
    ]);
  });

  it("atendido_parcial quando o estoque ativo não cobre tudo (falta_estoque)", () => {
    const lotes = [lote({ id: 1, quantidade: 3, validade: FUTURO })];
    const plano = planejarExpedicaoItem(10, lotes, HOJE);
    expect(plano.qtdExpedida).toBe(3);
    expect(plano.statusItem).toBe("atendido_parcial");
    expect(plano.motivoDivergencia).toBe("falta_estoque");
  });

  it("aguardando_reposicao quando não há lote ativo (nada sai)", () => {
    const plano = planejarExpedicaoItem(5, [], HOJE);
    expect(plano.qtdExpedida).toBe(0);
    expect(plano.alocacoes).toEqual([]);
    expect(plano.statusItem).toBe("aguardando_reposicao");
    expect(plano.motivoDivergencia).toBe("falta_estoque");
  });

  it("ignora lotes vencidos e segregados (não expedíveis — INV08)", () => {
    const lotes = [
      lote({ id: 1, quantidade: 5, validade: "2020-01-01" }), // vencido
      lote({ id: 2, quantidade: 5, validade: FUTURO, estado: "segregado" }),
      lote({ id: 3, quantidade: 4, validade: FUTURO }), // único expedível
    ];
    const plano = planejarExpedicaoItem(10, lotes, HOJE);
    expect(plano.qtdExpedida).toBe(4);
    expect(plano.alocacoes).toEqual([{ loteId: 3, quantidade: 4 }]);
    expect(plano.statusItem).toBe("atendido_parcial");
  });
});
