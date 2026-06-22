import { describe, it, expect, beforeEach } from "vitest";
import { PedidoService } from "./PedidoService.js";
import type {
  IPedidoRepository,
  NovoItemSemPedido,
  NovoPedidoSemId,
  PedidoComItens,
} from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { ItemDoPedido, StatusPedido } from "../entities/index.js";

// Repo in-memory implementando IPedidoRepository (molde de EstoqueService.test.ts).
// Cobre criar(): o expedir() depende de db.transaction (Postgres) e tem sua
// lógica crítica isolada e testada em domain/pedido.planejarExpedicaoItem.
class InMemPedidoRepo implements IPedidoRepository {
  public pedidos: PedidoComItens[] = [];
  private seq = 0;

  async criar(cabecalho: NovoPedidoSemId, itens: NovoItemSemPedido[]): Promise<PedidoComItens> {
    this.seq += 1;
    const id = `PED-${String(this.seq).padStart(3, "0")}`;
    const itensCriados = itens.map((i, idx) =>
      ({
        id: idx + 1,
        pedidoId: id,
        produtoId: i.produtoId ?? null,
        descricaoLivre: i.descricaoLivre ?? null,
        qtdSolicitada: i.qtdSolicitada,
        qtdExpedida: null,
        loteExpedidoId: null,
        unidade: i.unidade,
        statusItem: i.statusItem ?? "pendente",
        motivoDivergencia: null,
        observacaoMotivo: null,
        itemPaiId: null,
        processadoPorId: null,
        dataProcessamento: null,
      }) as ItemDoPedido,
    );
    const pedido = {
      id,
      ...cabecalho,
      dataCriacao: new Date(),
      status: "pendente" as StatusPedido,
      itens: itensCriados,
    } as PedidoComItens;
    this.pedidos.push(pedido);
    return pedido;
  }

  async buscarPorId(id: string): Promise<PedidoComItens | null> {
    return this.pedidos.find((p) => p.id === id) ?? null;
  }
  async listarPorSetor(setorId: number): Promise<PedidoComItens[]> {
    return this.pedidos.filter(
      (p) => p.setorOrigemId === setorId || p.setorDestinoId === setorId,
    );
  }
  async listarPendentes(): Promise<PedidoComItens[]> {
    return this.pedidos
      .filter((p) => p.status === "pendente" || p.status === "em_processamento")
      .sort((a, b) => a.dataCriacao.getTime() - b.dataCriacao.getTime());
  }
  async atualizarStatus(id: string, status: StatusPedido): Promise<void> {
    const p = this.pedidos.find((x) => x.id === id);
    if (p) p.status = status;
  }
}

describe("PedidoService.criar (RN09 / INV07)", () => {
  let repo: InMemPedidoRepo;
  let service: PedidoService;

  beforeEach(() => {
    repo = new InMemPedidoRepo();
    // db não é usado em criar(); passamos um stub para satisfazer o construtor.
    service = new PedidoService(repo, {} as never);
  });

  const base = {
    setorOrigemId: 1,
    setorDestinoId: 2,
    solicitanteId: 10,
    justificativa: "Reposição mensal do CEO",
  };

  it("cria pedido válido com itens pendentes", async () => {
    const pedido = await service.criar({
      ...base,
      itens: [{ produtoId: 5, qtdSolicitada: 3, unidade: "caixa" }],
    });
    expect(pedido.id).toMatch(/^PED-\d{3}$/);
    expect(pedido.status).toBe("pendente");
    expect(pedido.itens).toHaveLength(1);
    expect(pedido.itens[0]!.statusItem).toBe("pendente");
    expect(pedido.itens[0]!.produtoId).toBe(5);
  });

  it("aceita item de descrição livre (XOR)", async () => {
    const pedido = await service.criar({
      ...base,
      itens: [{ descricaoLivre: "Item fora do catálogo", qtdSolicitada: 1, unidade: "unidade" }],
    });
    expect(pedido.itens[0]!.descricaoLivre).toBe("Item fora do catálogo");
    expect(pedido.itens[0]!.produtoId).toBeNull();
  });

  it("rejeita justificativa com menos de 10 caracteres (RN09)", async () => {
    await expect(
      service.criar({ ...base, justificativa: "curto", itens: [{ produtoId: 1, qtdSolicitada: 1, unidade: "caixa" }] }),
    ).rejects.toThrow(/10 caracteres/);
  });

  it("rejeita pedido sem itens (RN09)", async () => {
    await expect(service.criar({ ...base, itens: [] })).rejects.toThrow(/ao menos um item/);
  });

  it("rejeita item com produtoId E descricaoLivre juntos (INV07)", async () => {
    await expect(
      service.criar({
        ...base,
        itens: [{ produtoId: 1, descricaoLivre: "x", qtdSolicitada: 1, unidade: "caixa" }],
      }),
    ).rejects.toThrow(/INV07/);
  });

  it("rejeita item sem produtoId e sem descricaoLivre (INV07)", async () => {
    await expect(
      service.criar({ ...base, itens: [{ qtdSolicitada: 1, unidade: "caixa" }] }),
    ).rejects.toThrow(/INV07/);
  });

  it("rejeita quantidade solicitada < 1 (RN09)", async () => {
    await expect(
      service.criar({ ...base, itens: [{ produtoId: 1, qtdSolicitada: 0, unidade: "caixa" }] }),
    ).rejects.toThrow(/>= 1/);
  });

  it("rejeita origem igual ao destino", async () => {
    await expect(
      service.criar({
        ...base,
        setorDestinoId: 1,
        itens: [{ produtoId: 1, qtdSolicitada: 1, unidade: "caixa" }],
      }),
    ).rejects.toThrow(/origem e destino/);
  });

  it("rejeita setor não-inteiro (NaN) antes de chegar ao banco", async () => {
    await expect(
      service.criar({
        ...base,
        setorDestinoId: NaN,
        itens: [{ produtoId: 1, qtdSolicitada: 1, unidade: "caixa" }],
      }),
    ).rejects.toThrow(/inteiros válidos/);
  });
});

describe("PedidoService.listarFilaPendentes (CEO-251)", () => {
  let repo: InMemPedidoRepo;
  let service: PedidoService;

  beforeEach(() => {
    repo = new InMemPedidoRepo();
    service = new PedidoService(repo, {} as never);
  });

  const base = {
    setorOrigemId: 2,
    setorDestinoId: 1,
    solicitanteId: 10,
    justificativa: "Reposição mensal do CEO",
  };

  it("retorna só pedidos com trabalho por fazer (pendente / em_processamento)", async () => {
    const p1 = await service.criar({ ...base, itens: [{ produtoId: 1, qtdSolicitada: 1, unidade: "caixa" }] });
    const p2 = await service.criar({ ...base, itens: [{ produtoId: 2, qtdSolicitada: 1, unidade: "caixa" }] });
    const p3 = await service.criar({ ...base, itens: [{ produtoId: 3, qtdSolicitada: 1, unidade: "caixa" }] });

    // p1 fica pendente; p2 em processamento; p3 já totalmente atendido (sai da fila).
    await repo.atualizarStatus(p2.id, "em_processamento");
    await repo.atualizarStatus(p3.id, "atendido_integral");

    const fila = await service.listarFilaPendentes();
    const ids = fila.map((p) => p.id);
    expect(ids).toContain(p1.id);
    expect(ids).toContain(p2.id);
    expect(ids).not.toContain(p3.id);
  });

  it("ordena por chegada (FIFO — mais antigo primeiro)", async () => {
    const antigo = await service.criar({ ...base, itens: [{ produtoId: 1, qtdSolicitada: 1, unidade: "caixa" }] });
    const novo = await service.criar({ ...base, itens: [{ produtoId: 2, qtdSolicitada: 1, unidade: "caixa" }] });
    // Força datas distintas (o stub usa new Date() no mesmo tick).
    antigo.dataCriacao = new Date("2026-06-01T08:00:00Z");
    novo.dataCriacao = new Date("2026-06-10T08:00:00Z");

    const fila = await service.listarFilaPendentes();
    expect(fila.map((p) => p.id)).toEqual([antigo.id, novo.id]);
  });

  it("retorna lista vazia quando não há pendências", async () => {
    const p = await service.criar({ ...base, itens: [{ produtoId: 1, qtdSolicitada: 1, unidade: "caixa" }] });
    await repo.atualizarStatus(p.id, "atendido_integral");
    expect(await service.listarFilaPendentes()).toHaveLength(0);
  });
});
