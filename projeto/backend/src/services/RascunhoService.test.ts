import { describe, it, expect, beforeEach } from "vitest";
import { RascunhoService, EMAIL_USUARIO_ROBO } from "./RascunhoService.js";
import type {
  IRascunhoRepository,
  ResultadoUpsertRascunho,
} from "../interfaces/repository-interfaces/IRascunhoRepo.js";
import type {
  IPedidoRepository,
  NovoItemSemPedido,
  NovoPedidoSemId,
  PedidoComItens,
} from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { IUsuarioRepository } from "../interfaces/repository-interfaces/IUsuarioRepo.js";
import type {
  PedidoRascunho,
  NovoPedidoRascunho,
  StatusTriagem,
  Usuario,
} from "../entities/index.js";
import type { DB } from "../db/client.js";

// ─── Fakes in-memory ──────────────────────────────────────────────────────────

// SIMULA o INSERT ... ON CONFLICT (message_id) DO NOTHING e as transições da
// triagem. O `tx` é ignorado (em unit não há transação real — ver fakeDb).
class InMemRascunhoRepo implements IRascunhoRepository {
  private porId = new Map<number, PedidoRascunho>();
  private porMessageId = new Map<string, PedidoRascunho>();
  private seq = 0;

  // Semeia um rascunho já existente (atalho para os testes de triagem).
  semear(parcial: Partial<PedidoRascunho> & { messageId: string }): PedidoRascunho {
    const linha = {
      id: ++this.seq,
      emailCru: "corpo",
      jsonExtraido: null,
      remetenteEmail: null,
      remetenteNome: null,
      confiancaGeral: null,
      statusTriagem: "pendente",
      temAnexo: false,
      pedidoId: null,
      criadoEm: new Date(),
      processadoEm: null,
      ...parcial,
    } as PedidoRascunho;
    this.porId.set(linha.id, linha);
    this.porMessageId.set(linha.messageId, linha);
    return linha;
  }

  async upsert(r: NovoPedidoRascunho): Promise<ResultadoUpsertRascunho> {
    const existente = this.porMessageId.get(r.messageId);
    if (existente) return { rascunho: existente, criado: false };
    const linha = this.semear({
      messageId: r.messageId,
      emailCru: r.emailCru,
      jsonExtraido: r.jsonExtraido ?? null,
      remetenteEmail: r.remetenteEmail ?? null,
      remetenteNome: r.remetenteNome ?? null,
      confiancaGeral: r.confiancaGeral ?? null,
      statusTriagem: r.statusTriagem ?? "pendente",
      temAnexo: r.temAnexo ?? false,
    });
    return { rascunho: linha, criado: true };
  }

  async buscarPorMessageId(messageId: string): Promise<PedidoRascunho | null> {
    return this.porMessageId.get(messageId) ?? null;
  }

  async buscarPorId(id: number): Promise<PedidoRascunho | null> {
    return this.porId.get(id) ?? null;
  }

  async listarPorStatus(status: StatusTriagem): Promise<PedidoRascunho[]> {
    return [...this.porId.values()].filter((r) => r.statusTriagem === status);
  }

  async marcarAprovado(id: number, pedidoId: string): Promise<void> {
    const r = this.porId.get(id);
    if (r) Object.assign(r, { statusTriagem: "aprovado", pedidoId, processadoEm: new Date() });
  }

  async marcarDescartado(id: number): Promise<boolean> {
    // Espelha o UPDATE condicional: só transiciona se ainda 'pendente'.
    const r = this.porId.get(id);
    if (!r || r.statusTriagem !== "pendente") return false;
    Object.assign(r, { statusTriagem: "descartado", processadoEm: new Date() });
    return true;
  }

  get tamanho(): number {
    return this.porId.size;
  }
}

// Captura o que foi pedido para criar e devolve um pedido fake.
class InMemPedidoRepo implements IPedidoRepository {
  public ultimoCabecalho: NovoPedidoSemId | null = null;
  public ultimosItens: NovoItemSemPedido[] = [];
  private seq = 0;

  async criar(cabecalho: NovoPedidoSemId, itens: NovoItemSemPedido[]): Promise<PedidoComItens> {
    this.ultimoCabecalho = cabecalho;
    this.ultimosItens = itens;
    const id = `PED-${String(++this.seq).padStart(3, "0")}`;
    return {
      id,
      status: "pendente",
      dataCriacao: new Date(),
      ...cabecalho,
      itens: itens.map((i, idx) => ({ id: idx + 1, pedidoId: id, ...i })),
    } as unknown as PedidoComItens;
  }
  async buscarPorId(): Promise<PedidoComItens | null> { return null; }
  async listarPorSetor(): Promise<PedidoComItens[]> { return []; }
  async atualizarStatus(): Promise<void> {}
}

class InMemUsuarioRepo implements IUsuarioRepository {
  constructor(private rows: Usuario[] = []) {}
  async criar(): Promise<Usuario> { throw new Error("não usado"); }
  async listar(): Promise<Usuario[]> { return this.rows; }
  async buscarPorId(id: number): Promise<Usuario | null> { return this.rows.find((u) => u.id === id) ?? null; }
  async buscarPorEmail(email: string): Promise<Usuario | null> { return this.rows.find((u) => u.email === email) ?? null; }
  async atualizar(): Promise<void> {}
}

// db fake: transaction(cb) apenas executa o callback com um "tx" inerte. As
// escritas reais acontecem nos fakes in-memory; o que importa aqui é a ordem e
// as regras, não o isolamento transacional (isso é coberto no teste de integração).
const fakeDb = {
  transaction: async <T>(cb: (tx: unknown) => Promise<T>): Promise<T> => cb({}),
} as unknown as DB;

const ROBO: Usuario = {
  id: 99,
  nome: "Agente de Email (Dispensação)",
  email: EMAIL_USUARIO_ROBO,
  cargo: "Agente automático",
  perfil: "solicitante",
  setorId: 3,
  avatar: "AE",
  senhaHash: null,
  trocarSenha: false,
  criadoEm: new Date(),
};

let rascunhoRepo: InMemRascunhoRepo;
let pedidoRepo: InMemPedidoRepo;
let usuarioRepo: InMemUsuarioRepo;
let service: RascunhoService;

beforeEach(() => {
  rascunhoRepo = new InMemRascunhoRepo();
  pedidoRepo = new InMemPedidoRepo();
  usuarioRepo = new InMemUsuarioRepo([ROBO]);
  service = new RascunhoService(rascunhoRepo, pedidoRepo, usuarioRepo, fakeDb);
});

// ─── Admissão (POST /rascunhos) ───────────────────────────────────────────────

const valido = () => ({
  messageId: "<abc@mail.ufpe.br>",
  emailCru: "De: ceo.ccs@ufpe.br\nAssunto: Solicitação\n\nPreciso de luvas M (2 caixas).",
  remetenteEmail: "ceo.ccs@ufpe.br",
  remetenteNome: "Ingrid e Zilma",
  jsonExtraido: { itens: [{ descricaoLivre: "luva M", qtd: 2 }] },
  confiancaGeral: 0.82,
  temAnexo: false,
});

describe("RascunhoService.registrar — admissão (EP08)", () => {
  it("grava um rascunho novo (criado=true)", async () => {
    const { rascunho, criado } = await service.registrar(valido());
    expect(criado).toBe(true);
    expect(rascunho.id).toBeGreaterThan(0);
    expect(rascunho.statusTriagem).toBe("pendente");
    expect(rascunho.remetenteEmail).toBe("ceo.ccs@ufpe.br");
  });

  it("é idempotente: o mesmo messageId não vira dois rascunhos (inbox pattern)", async () => {
    const primeiro = await service.registrar(valido());
    const segundo = await service.registrar(valido());
    expect(primeiro.criado).toBe(true);
    expect(segundo.criado).toBe(false);
    expect(segundo.rascunho.id).toBe(primeiro.rascunho.id);
    expect(rascunhoRepo.tamanho).toBe(1);
  });

  it("rejeita messageId ausente/vazio (idempotência depende dele)", async () => {
    await expect(service.registrar({ ...valido(), messageId: "  " })).rejects.toThrow("messageId");
  });

  it("rejeita emailCru ausente (auditoria depende dele)", async () => {
    await expect(service.registrar({ ...valido(), emailCru: "" })).rejects.toThrow("emailCru");
  });

  it("rejeita confiancaGeral fora de [0,1]", async () => {
    await expect(service.registrar({ ...valido(), confiancaGeral: 1.5 })).rejects.toThrow("confiancaGeral");
  });

  it("aceita rascunho sem remetente nem confiança (campos opcionais)", async () => {
    const { rascunho, criado } = await service.registrar({
      messageId: "<sem-meta@mail.ufpe.br>",
      emailCru: "corpo qualquer com pedido",
    });
    expect(criado).toBe(true);
    expect(rascunho.remetenteEmail).toBeNull();
    expect(rascunho.confiancaGeral).toBeNull();
  });
});

// ─── Triagem: promoção e descarte (CEO-276) ──────────────────────────────────

const aprovacao = () => ({
  setorOrigemId: 2, // CEO (solicitante) — escolhido pelo almoxarife
  setorDestinoId: 1, // HO
  justificativa: "Solicitação recebida por email da Dispensação.",
  itens: [
    { produtoId: 5, qtdSolicitada: 2, unidade: "caixa" as const },
    { descricaoLivre: "evidenciador de placa", qtdSolicitada: 1, unidade: "frasco" as const },
  ],
});

describe("RascunhoService.promover — rascunho → pedido (CEO-276)", () => {
  it("cria pedido com solicitante=robô, origemCanal=email e remetente do rascunho", async () => {
    const r = rascunhoRepo.semear({
      messageId: "<promo@mail.ufpe.br>",
      remetenteEmail: "ceo.ccs@ufpe.br",
      remetenteNome: "Ingrid e Zilma",
    });
    const pedido = await service.promover(r.id, aprovacao());

    expect(pedido.id).toMatch(/^PED-/);
    // Identidade: solicitante é o robô (não o almoxarife); humano real nas colunas novas.
    expect(pedidoRepo.ultimoCabecalho).toMatchObject({
      solicitanteId: ROBO.id,
      origemCanal: "email",
      remetenteEmail: "ceo.ccs@ufpe.br",
      remetenteNome: "Ingrid e Zilma",
      setorOrigemId: 2,
      setorDestinoId: 1,
    });
    // Itens preservam o XOR (um com produtoId, outro com descricaoLivre).
    expect(pedidoRepo.ultimosItens).toHaveLength(2);
    expect(pedidoRepo.ultimosItens.every((i) => i.statusItem === "pendente")).toBe(true);
  });

  it("marca o rascunho aprovado e o amarra ao pedido criado", async () => {
    const r = rascunhoRepo.semear({ messageId: "<promo2@mail.ufpe.br>" });
    const pedido = await service.promover(r.id, aprovacao());
    const depois = await rascunhoRepo.buscarPorId(r.id);
    expect(depois!.statusTriagem).toBe("aprovado");
    expect(depois!.pedidoId).toBe(pedido.id);
    expect(depois!.processadoEm).not.toBeNull();
  });

  it("recusa promover um rascunho já aprovado (idempotência da triagem)", async () => {
    const r = rascunhoRepo.semear({ messageId: "<jafeito@mail.ufpe.br>", statusTriagem: "aprovado" });
    await expect(service.promover(r.id, aprovacao())).rejects.toThrow("já foi aprovado");
  });

  it("recusa promover rascunho inexistente (404)", async () => {
    await expect(service.promover(999, aprovacao())).rejects.toThrow("não encontrado");
  });

  it("exige justificativa >= 10 chars (RN09)", async () => {
    const r = rascunhoRepo.semear({ messageId: "<curta@mail.ufpe.br>" });
    await expect(service.promover(r.id, { ...aprovacao(), justificativa: "curta" })).rejects.toThrow("Justificativa");
  });

  it("aplica XOR INV07: item com produtoId E descricaoLivre é rejeitado", async () => {
    const r = rascunhoRepo.semear({ messageId: "<xor@mail.ufpe.br>" });
    const ruim = { ...aprovacao(), itens: [{ produtoId: 5, descricaoLivre: "ambos", qtdSolicitada: 1, unidade: "caixa" as const }] };
    await expect(service.promover(r.id, ruim)).rejects.toThrow("INV07");
  });

  it("exige qtd >= 1 (RN09)", async () => {
    const r = rascunhoRepo.semear({ messageId: "<qtd0@mail.ufpe.br>" });
    const ruim = { ...aprovacao(), itens: [{ produtoId: 5, qtdSolicitada: 0, unidade: "caixa" as const }] };
    await expect(service.promover(r.id, ruim)).rejects.toThrow("RN09");
  });

  it("rejeita itens não-array (body malformado) com 400, não 500", async () => {
    const r = rascunhoRepo.semear({ messageId: "<naoarray@mail.ufpe.br>" });
    // itens como string (ex.: cliente mandou errado) — não pode estourar .map.
    const ruim = { ...aprovacao(), itens: "luvas" } as unknown as Parameters<typeof service.promover>[1];
    await expect(service.promover(r.id, ruim)).rejects.toThrow("ao menos um item");
  });

  it("rejeita se o usuário-robô não existir (seed não rodou)", async () => {
    service = new RascunhoService(rascunhoRepo, pedidoRepo, new InMemUsuarioRepo([]), fakeDb);
    const r = rascunhoRepo.semear({ messageId: "<semrobo@mail.ufpe.br>" });
    await expect(service.promover(r.id, aprovacao())).rejects.toThrow("robô");
  });

  it("recusa origem == destino", async () => {
    const r = rascunhoRepo.semear({ messageId: "<mesmosetor@mail.ufpe.br>" });
    await expect(service.promover(r.id, { ...aprovacao(), setorDestinoId: 2 })).rejects.toThrow("origem e destino");
  });
});

describe("RascunhoService.descartar (CEO-276)", () => {
  it("marca descartado sem criar pedido", async () => {
    const r = rascunhoRepo.semear({ messageId: "<spam@mail.ufpe.br>" });
    await service.descartar(r.id);
    const depois = await rascunhoRepo.buscarPorId(r.id);
    expect(depois!.statusTriagem).toBe("descartado");
    expect(pedidoRepo.ultimoCabecalho).toBeNull(); // nenhum pedido criado
  });

  it("recusa descartar o que já foi decidido", async () => {
    const r = rascunhoRepo.semear({ messageId: "<jadesc@mail.ufpe.br>", statusTriagem: "descartado" });
    await expect(service.descartar(r.id)).rejects.toThrow("já foi decidido");
  });

  it("anti-corrida: se foi aprovado entre a leitura e o update, NÃO sobrescreve para descartado", async () => {
    // Simula a janela: rascunho lido como pendente, mas aprovado por outra ação
    // antes do marcarDescartado. O UPDATE condicional casa 0 linhas → não muda.
    const r = rascunhoRepo.semear({ messageId: "<corrida@mail.ufpe.br>" });
    const original = rascunhoRepo.buscarPorId.bind(rascunhoRepo);
    // buscarPorId devolve 'pendente' (estado antes da corrida)...
    rascunhoRepo.buscarPorId = async (id: number) => {
      const linha = await original(id);
      return linha ? { ...linha, statusTriagem: "pendente" } : null;
    };
    // ...mas o estado REAL já virou aprovado (a aprovação concorrente venceu).
    Object.assign((await original(r.id))!, { statusTriagem: "aprovado", pedidoId: "PED-001" });

    await expect(service.descartar(r.id)).rejects.toThrow("já foi decidido");
    const depois = await original(r.id);
    expect(depois!.statusTriagem).toBe("aprovado"); // preservado, não sobrescrito
    expect(depois!.pedidoId).toBe("PED-001");
  });
});

describe("RascunhoService.listarPendentes (CEO-276)", () => {
  it("retorna só os pendentes", async () => {
    rascunhoRepo.semear({ messageId: "<p1@mail.ufpe.br>" });
    rascunhoRepo.semear({ messageId: "<p2@mail.ufpe.br>", statusTriagem: "aprovado" });
    rascunhoRepo.semear({ messageId: "<p3@mail.ufpe.br>" });
    const pendentes = await service.listarPendentes();
    expect(pendentes).toHaveLength(2);
    expect(pendentes.every((r) => r.statusTriagem === "pendente")).toBe(true);
  });
});
