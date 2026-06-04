import { describe, it, expect, beforeEach } from "vitest";
import { ProdutoService } from "./ProdutoService.js";
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { Produto, Lote, NovoProduto, NovoLote } from "../entities/index.js";

class InMemProdutoRepo implements IProdutoRepository {
  constructor(private rows: Produto[] = []) {}
  async criar(p: NovoProduto): Promise<Produto> {
    const row = {
      id: this.rows.length + 1,
      localizacao: null,
      fornecedor: null,
      estoqueMinimo: 0,
      estoqueMaximo: 9999,
      ...p,
    } as Produto;
    this.rows.push(row);
    return row;
  }
  async listar(): Promise<Produto[]> { return this.rows.map((r) => ({ ...r })); }
  async buscarPorId(id: number): Promise<Produto | null> { return this.rows.find((r) => r.id === id) ?? null; }
  async buscarPorNome(nome: string): Promise<Produto | null> { return this.rows.find((r) => r.nome === nome) ?? null; }
  async atualizar(id: number, props: Partial<Omit<Produto, "id">>): Promise<void> {
    const i = this.rows.findIndex((r) => r.id === id);
    if (i >= 0) this.rows[i] = { ...this.rows[i], ...props } as Produto;
  }
  async remover(id: number): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}

class InMemLoteRepo implements ILoteRepository {
  constructor(private rows: Lote[] = []) {}
  async criar(l: NovoLote): Promise<Lote> {
    const row = { id: this.rows.length + 1, fabricacao: null, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null, ...l } as Lote;
    this.rows.push(row);
    return row;
  }
  async buscarPorId(id: number): Promise<Lote | null> { return this.rows.find((r) => r.id === id) ?? null; }
  async listarPorProdutoSetor(produtoId: number, setorId: number): Promise<Lote[]> {
    return this.rows.filter((r) => r.produtoId === produtoId && r.setorId === setorId);
  }
  async listarPorProdutoTodosSetores(produtoId: number): Promise<Lote[]> {
    return this.rows.filter((r) => r.produtoId === produtoId);
  }
  async listarPorSetor(setorId: number): Promise<Lote[]> { return this.rows.filter((r) => r.setorId === setorId); }
  async atualizar(): Promise<void> {}
}

let produtoRepo: InMemProdutoRepo;
let service: ProdutoService;

beforeEach(() => {
  produtoRepo = new InMemProdutoRepo([
    { id: 1, nome: "Luva P", categoria: "EPI", unidade: "caixa", estoqueMinimo: 10, estoqueMaximo: 100, localizacao: null, fornecedor: null },
  ]);
});

describe("ProdutoService.cadastrar (US-EP02-04)", () => {
  beforeEach(() => { service = new ProdutoService(produtoRepo, new InMemLoteRepo()); });

  it("cadastra produto válido com 0 lotes", async () => {
    const p = await service.cadastrar({ nome: "Resina A2", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 5, estoqueMaximo: 30 });
    expect(p.id).toBeGreaterThan(0);
    expect(p.nome).toBe("Resina A2");
  });

  it("rejeita nome vazio", async () => {
    await expect(service.cadastrar({ nome: "  ", categoria: "EPI", unidade: "caixa" })).rejects.toThrow("obrigatório");
  });

  it("rejeita categoria inválida", async () => {
    await expect(service.cadastrar({ nome: "X", categoria: "Inexistente" as any, unidade: "caixa" })).rejects.toThrow("Categoria inválida");
  });

  it("rejeita nome duplicado", async () => {
    await expect(service.cadastrar({ nome: "Luva P", categoria: "EPI", unidade: "caixa" })).rejects.toThrow("Já existe");
  });

  it("rejeita estoque mínimo negativo", async () => {
    await expect(service.cadastrar({ nome: "Y", categoria: "EPI", unidade: "caixa", estoqueMinimo: -1 })).rejects.toThrow("negativo");
  });
});

describe("ProdutoService.remover (RN13)", () => {
  it("remove produto sem lotes ativos", async () => {
    service = new ProdutoService(produtoRepo, new InMemLoteRepo([]));
    await service.remover(1);
    expect(await produtoRepo.buscarPorId(1)).toBeNull();
  });

  it("recusa remover produto com lote ativo (RN13)", async () => {
    const lotes = new InMemLoteRepo([
      { id: 1, produtoId: 1, setorId: 1, numeroLote: "A", fabricacao: null, validade: "2027-01-01", quantidade: 5, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    ]);
    service = new ProdutoService(produtoRepo, lotes);
    await expect(service.remover(1)).rejects.toThrow("lotes ativos");
    expect(await produtoRepo.buscarPorId(1)).not.toBeNull();
  });

  it("permite remover produto cujos lotes estão todos vencidos/segregados", async () => {
    const lotes = new InMemLoteRepo([
      { id: 1, produtoId: 1, setorId: 1, numeroLote: "A", fabricacao: null, validade: "2020-01-01", quantidade: 5, estado: "vencido", dataSegregacao: null, observacaoSegregacao: null },
    ]);
    service = new ProdutoService(produtoRepo, lotes);
    await service.remover(1);
    expect(await produtoRepo.buscarPorId(1)).toBeNull();
  });
});
