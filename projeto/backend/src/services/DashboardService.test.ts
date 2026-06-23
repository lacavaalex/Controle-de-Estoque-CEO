import { describe, it, expect, beforeEach } from "vitest";
import { DashboardService, contarLotesVencendo } from "./DashboardService.js";
import { EstoqueService } from "./EstoqueService.js";
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { IPedidoRepository, PedidoComItens } from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";
import type {
  Produto,
  Lote,
  Setor,
  NovoProduto,
  NovoLote,
  NovoSetor,
  ItemDoPedido,
} from "../entities/index.js";

const HOJE = new Date("2026-06-02T12:00:00Z");

function validadeEmDias(dias: number): string {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

class InMemSetorRepo implements ISetorRepository {
  constructor(private rows: Setor[]) {}
  async criar(s: NovoSetor): Promise<Setor> {
    const row = { id: this.rows.length + 1, emailInstitucional: null, ...s } as Setor;
    this.rows.push(row);
    return row;
  }
  async listar(): Promise<Setor[]> { return this.rows.map((r) => ({ ...r })); }
  async buscarPorId(id: number): Promise<Setor | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }
}

class InMemProdutoRepo implements IProdutoRepository {
  constructor(private rows: Produto[]) {}
  async criar(p: NovoProduto): Promise<Produto> {
    const row = { id: this.rows.length + 1, localizacao: null, fornecedor: null, estoqueMinimo: 0, estoqueMaximo: 9999, ...p } as Produto;
    this.rows.push(row);
    return row;
  }
  async listar(): Promise<Produto[]> { return this.rows.map((r) => ({ ...r })); }
  async buscarPorId(id: number): Promise<Produto | null> { return this.rows.find((r) => r.id === id) ?? null; }
  async buscarPorNome(nome: string): Promise<Produto | null> { return this.rows.find((r) => r.nome === nome) ?? null; }
  async atualizar(): Promise<void> {}
  async remover(): Promise<void> {}
}

class InMemLoteRepo implements ILoteRepository {
  constructor(private rows: Lote[]) {}
  async criar(l: NovoLote): Promise<Lote> {
    const row = { id: this.rows.length + 1, fabricacao: null, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null, ...l } as Lote;
    this.rows.push(row);
    return row;
  }
  async buscarPorId(id: number): Promise<Lote | null> { return this.rows.find((r) => r.id === id) ?? null; }
  async listarPorProdutoSetor(produtoId: number, setorId: number): Promise<Lote[]> {
    return this.rows.filter((r) => r.produtoId === produtoId && r.setorId === setorId).map((r) => ({ ...r }));
  }
  async listarPorProdutoTodosSetores(produtoId: number): Promise<Lote[]> {
    return this.rows.filter((r) => r.produtoId === produtoId).map((r) => ({ ...r }));
  }
  async listarPorSetor(setorId: number): Promise<Lote[]> {
    return this.rows.filter((r) => r.setorId === setorId).map((r) => ({ ...r }));
  }
  async atualizar(): Promise<void> {}
}

class InMemPedidoRepo implements IPedidoRepository {
  constructor(private rows: PedidoComItens[]) {}
  async criar(): Promise<PedidoComItens> { throw new Error("não usado"); }
  async buscarPorId(id: string): Promise<PedidoComItens | null> {
    return this.rows.find((p) => p.id === id) ?? null;
  }
  async listarPorSetor(setorId: number): Promise<PedidoComItens[]> {
    return this.rows.filter((p) => p.setorOrigemId === setorId || p.setorDestinoId === setorId);
  }
  async atualizarStatus(): Promise<void> {}
}

function item(partial: Partial<ItemDoPedido> & Pick<ItemDoPedido, "pedidoId" | "qtdSolicitada" | "unidade" | "statusItem">): ItemDoPedido {
  return {
    id: partial.id ?? 1,
    produtoId: partial.produtoId ?? 1,
    descricaoLivre: null,
    qtdExpedida: null,
    loteExpedidoId: null,
    motivoDivergencia: null,
    observacaoMotivo: null,
    itemPaiId: null,
    processadoPorId: null,
    dataProcessamento: null,
    ...partial,
  } as ItemDoPedido;
}

function pedido(partial: Partial<PedidoComItens> & Pick<PedidoComItens, "id" | "setorOrigemId" | "setorDestinoId" | "itens">): PedidoComItens {
  return {
    solicitanteId: 1,
    justificativa: "teste",
    dataCriacao: HOJE,
    status: "pendente",
    ...partial,
  } as PedidoComItens;
}

let service: DashboardService;

beforeEach(() => {
  const setores: Setor[] = [
    { id: 1, nome: "HO", tipo: "almoxarifado", emailInstitucional: null },
    { id: 2, nome: "CEO", tipo: "destinatario", emailInstitucional: null },
  ];
  const produtos: Produto[] = [
    { id: 1, nome: "Luva", categoria: "EPI", unidade: "caixa", estoqueMinimo: 10, estoqueMaximo: 100, localizacao: null, fornecedor: null },
    { id: 2, nome: "Resina", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 10, estoqueMaximo: 60, localizacao: null, fornecedor: null },
    { id: 3, nome: "Ácido", categoria: "Outros", unidade: "seringa", estoqueMinimo: 5, estoqueMaximo: 50, localizacao: null, fornecedor: null },
  ];
  const lotes: Lote[] = [
    // Crítico no HO: 3 unidades (abaixo do mínimo 10)
    { id: 1, produtoId: 1, setorId: 1, numeroLote: "A", fabricacao: null, validade: validadeEmDias(300), quantidade: 3, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    // Vencendo em 20 dias (≤30)
    { id: 2, produtoId: 2, setorId: 1, numeroLote: "B", fabricacao: null, validade: validadeEmDias(20), quantidade: 15, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    // Atenção em 45 dias (≤60, >30)
    { id: 3, produtoId: 2, setorId: 1, numeroLote: "C", fabricacao: null, validade: validadeEmDias(45), quantidade: 10, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    // Vencido — não conta
    { id: 4, produtoId: 2, setorId: 1, numeroLote: "D", fabricacao: null, validade: validadeEmDias(-5), quantidade: 5, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    // Segregado — não conta
    { id: 5, produtoId: 2, setorId: 1, numeroLote: "E", fabricacao: null, validade: validadeEmDias(10), quantidade: 5, estado: "segregado", dataSegregacao: null, observacaoSegregacao: null },
    // Lote no CEO (outro setor) — não entra no KPI do HO
    { id: 6, produtoId: 1, setorId: 2, numeroLote: "F", fabricacao: null, validade: validadeEmDias(15), quantidade: 50, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
  ];
  const pedidos: PedidoComItens[] = [
    pedido({
      id: "PED-001",
      setorOrigemId: 2,
      setorDestinoId: 1,
      status: "pendente",
      itens: [item({ id: 1, pedidoId: "PED-001", produtoId: 1, qtdSolicitada: 5, unidade: "caixa", statusItem: "pendente" })],
    }),
    pedido({
      id: "PED-002",
      setorOrigemId: 2,
      setorDestinoId: 1,
      status: "aguardando_reposicao",
      itens: [
        item({ id: 2, pedidoId: "PED-002", produtoId: 3, qtdSolicitada: 5, unidade: "seringa", statusItem: "aguardando_reposicao" }),
        item({ id: 3, pedidoId: "PED-002", produtoId: 1, qtdSolicitada: 10, unidade: "caixa", statusItem: "aguardando_reposicao" }),
      ],
    }),
    pedido({
      id: "PED-003",
      setorOrigemId: 2,
      setorDestinoId: 1,
      status: "atendido_integral",
      itens: [item({ id: 4, pedidoId: "PED-003", produtoId: 1, qtdSolicitada: 2, unidade: "caixa", statusItem: "aguardando_reposicao" })],
    }),
  ];

  const produtoRepo = new InMemProdutoRepo(produtos);
  const loteRepo = new InMemLoteRepo(lotes);
  const pedidoRepo = new InMemPedidoRepo(pedidos);
  const estoqueService = new EstoqueService(produtoRepo, loteRepo, new InMemSetorRepo(setores));
  service = new DashboardService(produtoRepo, loteRepo, pedidoRepo, estoqueService);
});

describe("contarLotesVencendo", () => {
  it("conta apenas lotes ativos com 0 < dias <= limite", () => {
    const lotes: Lote[] = [
      { id: 1, produtoId: 1, setorId: 1, numeroLote: "A", fabricacao: null, validade: validadeEmDias(20), quantidade: 1, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
      { id: 2, produtoId: 1, setorId: 1, numeroLote: "B", fabricacao: null, validade: validadeEmDias(45), quantidade: 1, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
      { id: 3, produtoId: 1, setorId: 1, numeroLote: "C", fabricacao: null, validade: validadeEmDias(-1), quantidade: 1, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
      { id: 4, produtoId: 1, setorId: 1, numeroLote: "D", fabricacao: null, validade: validadeEmDias(10), quantidade: 1, estado: "segregado", dataSegregacao: null, observacaoSegregacao: null },
    ];
    expect(contarLotesVencendo(lotes, HOJE, 30)).toBe(1);
    expect(contarLotesVencendo(lotes, HOJE, 60)).toBe(2);
  });
});

describe("DashboardService.kpis", () => {
  it("agrega KPIs do setor HO", async () => {
    const kpis = await service.kpis(1, HOJE);

    expect(kpis.totalProdutos).toBe(3);
    expect(kpis.produtosCriticos).toBe(1);
    expect(kpis.lotesVencendo30).toBe(1);
    expect(kpis.lotesVencendo60).toBe(2);
    expect(kpis.pedidosPendentes).toBe(1);
  });

  it("agrupa demanda represada por produto", async () => {
    const kpis = await service.kpis(1, HOJE);

    expect(kpis.demandaRepresada).toHaveLength(2);
    const luva = kpis.demandaRepresada.find((d) => d.produtoId === 1)!;
    const acido = kpis.demandaRepresada.find((d) => d.produtoId === 3)!;

    expect(luva.nome).toBe("Luva");
    expect(luva.qtdSolicitadaTotal).toBe(12); // 10 + 2 (dois pedidos distintos)
    expect(luva.numPedidos).toBe(2);

    expect(acido.nome).toBe("Ácido");
    expect(acido.qtdSolicitadaTotal).toBe(5);
    expect(acido.numPedidos).toBe(1);
  });

  it("escopa lotes pelo setor informado", async () => {
    const kpisHo = await service.kpis(1, HOJE);
    const kpisCeo = await service.kpis(2, HOJE);

    expect(kpisHo.lotesVencendo30).toBe(1);
    expect(kpisCeo.lotesVencendo30).toBe(1);
    expect(kpisHo.lotesVencendo60).toBe(2);
    expect(kpisCeo.lotesVencendo60).toBe(1);
  });
});
