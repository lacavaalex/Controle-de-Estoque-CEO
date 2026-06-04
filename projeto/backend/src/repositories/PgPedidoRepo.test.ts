import { describe, it, expect } from "vitest";
import type { ItemDoPedido } from "../entities/index.js";
import { aninharItens } from "./PgPedidoRepo.js";

// Item mínimo para o teste de aninhamento (só os campos que aninharItens usa).
function item(props: Pick<ItemDoPedido, "id" | "itemPaiId"> & Partial<ItemDoPedido>): ItemDoPedido {
  return {
    pedidoId: "PED-001",
    produtoId: 1,
    descricaoLivre: null,
    qtdSolicitada: 1,
    qtdExpedida: null,
    loteExpedidoId: null,
    unidade: "caixa",
    statusItem: "pendente",
    motivoDivergencia: null,
    observacaoMotivo: null,
    processadoPorId: null,
    dataProcessamento: null,
    ...props,
  } as ItemDoPedido;
}

describe("aninharItens (RF05.17)", () => {
  it("retorna só raízes quando não há filhos", () => {
    const linhas = [item({ id: 1, itemPaiId: null }), item({ id: 2, itemPaiId: null })];
    const raizes = aninharItens(linhas);
    expect(raizes).toHaveLength(2);
    expect(raizes.every((r) => r.desdobramentos === undefined)).toBe(true);
  });

  it("aninha filhos sob o item-pai correto", () => {
    const linhas = [
      item({ id: 10, itemPaiId: null }), // pai
      item({ id: 11, itemPaiId: 10, loteExpedidoId: 100, qtdExpedida: 5 }),
      item({ id: 12, itemPaiId: 10, loteExpedidoId: 101, qtdExpedida: 3 }),
      item({ id: 20, itemPaiId: null }), // outra raiz, sem filhos
    ];
    const raizes = aninharItens(linhas);
    expect(raizes.map((r) => r.id).sort()).toEqual([10, 20]);

    const pai = raizes.find((r) => r.id === 10)!;
    expect(pai.desdobramentos).toHaveLength(2);
    expect(pai.desdobramentos!.map((f) => f.loteExpedidoId).sort()).toEqual([100, 101]);

    const outra = raizes.find((r) => r.id === 20)!;
    expect(outra.desdobramentos).toBeUndefined();
  });

  it("não promove filhos a raiz (não distorce a contagem de status — RN10)", () => {
    const linhas = [
      item({ id: 1, itemPaiId: null, statusItem: "atendido_parcial" }),
      item({ id: 2, itemPaiId: 1, statusItem: "atendido_integral" }),
      item({ id: 3, itemPaiId: 1, statusItem: "atendido_integral" }),
    ];
    const raizes = aninharItens(linhas);
    // Apenas 1 item raiz conta para o status do pedido.
    expect(raizes).toHaveLength(1);
    expect(raizes[0]!.statusItem).toBe("atendido_parcial");
  });
});
