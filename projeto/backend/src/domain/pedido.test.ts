import { describe, it, expect } from "vitest";
import type { Lote, StatusItem } from "../entities/index.js";
import {
  direcaoExpedicao,
  planejarEntradaCeo,
  planejarExpedicaoItem,
  statusDerivadoDoPedido,
} from "./pedido.js";

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

describe("direcaoExpedicao (RN19/INV09)", () => {
  it("inverte a direção do pedido: bens saem do HO (=destino) p/ o CEO (=origem)", () => {
    // Pedido: origem=CEO(7) solicita, destino=HO(1) atende.
    const dir = direcaoExpedicao({ setorOrigemId: 7, setorDestinoId: 1 });
    expect(dir.setorHoId).toBe(1); // bens saem do HO
    expect(dir.setorCeoId).toBe(7); // bens entram no CEO
  });
});

describe("planejarEntradaCeo (RN19/INV09 — 2ª perna)", () => {
  it("cria novo lote-CEO copiando numeroLote/fabricacao/validade do lote-HO", () => {
    const lotesHo = [
      lote({ id: 10, quantidade: 0, validade: "2027-01-01", numeroLote: "LT-A", fabricacao: "2025-01-01", produtoId: 5 }),
    ];
    const legs = planejarEntradaCeo([{ loteId: 10, quantidade: 4 }], lotesHo, []);
    expect(legs).toEqual([
      {
        loteHoId: 10,
        numeroLote: "LT-A",
        fabricacao: "2025-01-01",
        validade: "2027-01-01",
        quantidade: 4,
        loteCeoExistenteId: null,
      },
    ]);
  });

  it("soma num lote-CEO existente de mesmo numeroLote + produto", () => {
    const lotesHo = [lote({ id: 10, quantidade: 0, validade: "2027-01-01", numeroLote: "LT-A", produtoId: 5 })];
    const lotesCeo = [lote({ id: 99, quantidade: 2, validade: "2027-01-01", numeroLote: "LT-A", setorId: 7, produtoId: 5 })];
    const legs = planejarEntradaCeo([{ loteId: 10, quantidade: 4 }], lotesHo, lotesCeo);
    expect(legs[0]!.loteCeoExistenteId).toBe(99);
    expect(legs[0]!.quantidade).toBe(4);
  });

  it("não casa lote-CEO de numeroLote igual mas produto diferente", () => {
    const lotesHo = [lote({ id: 10, quantidade: 0, validade: "2027-01-01", numeroLote: "LT-A", produtoId: 5 })];
    const lotesCeo = [lote({ id: 99, quantidade: 2, validade: "2027-01-01", numeroLote: "LT-A", setorId: 7, produtoId: 6 })];
    const legs = planejarEntradaCeo([{ loteId: 10, quantidade: 4 }], lotesHo, lotesCeo);
    expect(legs[0]!.loteCeoExistenteId).toBeNull();
  });

  it("uma perna por alocação (FEFO multi-lote)", () => {
    const lotesHo = [
      lote({ id: 1, quantidade: 0, validade: "2026-08-01", numeroLote: "LT-1", produtoId: 5 }),
      lote({ id: 2, quantidade: 0, validade: "2027-06-01", numeroLote: "LT-2", produtoId: 5 }),
    ];
    const legs = planejarEntradaCeo(
      [{ loteId: 1, quantidade: 5 }, { loteId: 2, quantidade: 2 }],
      lotesHo,
      [],
    );
    expect(legs.map((l) => [l.numeroLote, l.quantidade])).toEqual([["LT-1", 5], ["LT-2", 2]]);
  });

  it("lança erro se a alocação referencia um lote-HO inexistente", () => {
    expect(() => planejarEntradaCeo([{ loteId: 404, quantidade: 1 }], [], [])).toThrow();
  });
});
