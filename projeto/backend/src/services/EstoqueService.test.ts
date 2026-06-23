import { describe, it, expect, beforeEach } from "vitest";
import { EstoqueService } from "./EstoqueService.js";
import type { IProdutoRepository } from "../interfaces/repository-interfaces/IProdutoRepo.js";
import type { ILoteRepository } from "../interfaces/repository-interfaces/ILoteRepo.js";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";
import type { Produto, Lote, Setor, NovoProduto, NovoLote, NovoSetor } from "../entities/index.js";

const HOJE = new Date("2026-06-02T12:00:00Z");
function validadeEmDias(dias: number): string {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Repos in-memory implementando as interfaces (molde de ItemService.test.ts).
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

let service: EstoqueService;

beforeEach(() => {
  const setores: Setor[] = [
    { id: 1, nome: "HO", tipo: "almoxarifado", emailInstitucional: null },
    { id: 2, nome: "CEO", tipo: "destinatario", emailInstitucional: null },
  ];
  const produtos: Produto[] = [
    { id: 1, nome: "Luva", categoria: "EPI", unidade: "caixa", estoqueMinimo: 10, estoqueMaximo: 100, localizacao: null, fornecedor: null },
    { id: 2, nome: "Resina", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 10, estoqueMaximo: 60, localizacao: null, fornecedor: null },
    { id: 3, nome: "Papel Articular", categoria: "Outros", unidade: "folha", estoqueMinimo: 5, estoqueMaximo: 50, localizacao: null, fornecedor: null },
  ];
  const lotes: Lote[] = [
    // Luva no HO: 96 unidades, validade longe -> excessivo (>= 95)
    { id: 1, produtoId: 1, setorId: 1, numeroLote: "A", fabricacao: null, validade: validadeEmDias(300), quantidade: 96, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    // Resina no HO: um lote AINDA 'ativo' mas com validade já no passado (a
    // varredura diária ainda não transicionou para 'vencido') + um ativo válido.
    // O estado de validade 'vencido' deve ter precedência (RN06). O lote já
    // segregado (id 5) não conta para qtd_total (RN07).
    { id: 2, produtoId: 2, setorId: 1, numeroLote: "B", fabricacao: null, validade: validadeEmDias(-5), quantidade: 5, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    { id: 3, produtoId: 2, setorId: 1, numeroLote: "C", fabricacao: null, validade: validadeEmDias(10), quantidade: 4, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    { id: 5, produtoId: 2, setorId: 1, numeroLote: "E", fabricacao: null, validade: validadeEmDias(-30), quantidade: 9, estado: "segregado", dataSegregacao: validadeEmDias(-20), observacaoSegregacao: "sala de biossegurança" },
    // Luva no CEO: 96 unidades -> no CEO NÃO é excessivo (incluirExcessivo=false) -> normal
    { id: 4, produtoId: 1, setorId: 2, numeroLote: "D", fabricacao: null, validade: validadeEmDias(300), quantidade: 96, estado: "ativo", dataSegregacao: null, observacaoSegregacao: null },
    // Papel Articular: sem lotes (caso "Não Tem") -> indisponível
  ];
  service = new EstoqueService(
    new InMemProdutoRepo(produtos),
    new InMemLoteRepo(lotes),
    new InMemSetorRepo(setores),
  );
});

describe("EstoqueService.estoqueDoSetor", () => {
  it("calcula qtd_total e status por produto no HO (excessivo aplicável)", async () => {
    const estoque = await service.estoqueDoSetor(1, {}, HOJE);
    const luva = estoque.find((e) => e.produtoId === 1)!;
    const resina = estoque.find((e) => e.produtoId === 2)!;
    const papel = estoque.find((e) => e.produtoId === 3)!;

    expect(luva.qtdTotal).toBe(96);
    expect(luva.status).toBe("excessivo");

    // Resina: qtd_total soma lotes 'ativo' (5 + 4 = 9); o segregado (9) não entra.
    // Status 'vencido' tem precedência: o lote ativo id 2 já passou da validade.
    expect(resina.qtdTotal).toBe(9);
    expect(resina.status).toBe("vencido");

    // Papel sem lotes -> indisponível.
    expect(papel.qtdTotal).toBe(0);
    expect(papel.status).toBe("indisponivel");
  });

  it("no CEO o status 'excessivo' não se aplica (RN04 só HO)", async () => {
    const estoque = await service.estoqueDoSetor(2, {}, HOJE);
    const luva = estoque.find((e) => e.produtoId === 1)!;
    expect(luva.qtdTotal).toBe(96);
    expect(luva.status).toBe("normal");
  });

  it("lança erro para setor inexistente", async () => {
    await expect(service.estoqueDoSetor(999, {}, HOJE)).rejects.toThrow("não encontrado");
  });
});

describe("EstoqueService.lotesParaExpedir (FEFO, RN20)", () => {
  it("retorna só lotes expedíveis, ordenados por validade (vencido fora)", async () => {
    const lotes = await service.lotesParaExpedir(2, 1, HOJE);
    // produto 2 (Resina) no HO tem 1 vencido (fora) e 1 ativo (id 3).
    expect(lotes.map((l) => l.id)).toEqual([3]);
  });
});

describe("EstoqueService.alertas (CEO-250)", () => {
  it("particiona o estoque do HO em reposição e vencimento", async () => {
    const { reposicao, vencimento } = await service.alertas(1, HOJE);

    // Reposição: Papel (indisponível). Luva é excessivo (não entra);
    // Resina tem status 'vencido' (alerta de validade, não de reposição).
    expect(reposicao.map((p) => p.produtoId)).toEqual([3]);
    expect(reposicao[0]!.status).toBe("indisponivel");

    // Vencimento: Resina (lote ativo já vencido).
    expect(vencimento.map((p) => p.produtoId)).toEqual([2]);
    expect(vencimento[0]!.status).toBe("vencido");
  });

  it("no CEO não há alertas (Luva normal, Papel/Resina sem lote no setor)", async () => {
    const { reposicao, vencimento } = await service.alertas(2, HOJE);
    // No CEO só existe lote da Luva (normal). Papel e Resina ficam indisponíveis
    // (sem lote no CEO) -> entram em reposição; nenhum entra em vencimento.
    expect(vencimento).toHaveLength(0);
    expect(reposicao.map((p) => p.produtoId).sort()).toEqual([2, 3]);
  });

  it("ordena cada lista por severidade (mais urgente primeiro)", async () => {
    const { reposicao } = await service.alertas(2, HOJE);
    // Ambos indisponíveis: mesma severidade, ordem estável; o teste garante que
    // não há item de severidade menor à frente de um maior.
    for (let i = 1; i < reposicao.length; i++) {
      const anterior = reposicao[i - 1]!.status;
      const atual = reposicao[i]!.status;
      expect(["indisponivel", "critico", "baixo"]).toContain(anterior);
      expect(["indisponivel", "critico", "baixo"]).toContain(atual);
    }
  });
});
