import { describe, it, expect, beforeEach } from "vitest";
import { RascunhoService } from "./RascunhoService.js";
import type {
  IRascunhoRepository,
  ResultadoUpsertRascunho,
} from "../interfaces/repository-interfaces/IRascunhoRepo.js";
import type { PedidoRascunho, NovoPedidoRascunho } from "../entities/index.js";

// Fake in-memory que SIMULA o INSERT ... ON CONFLICT (message_id) DO NOTHING:
// a 1ª gravação de um messageId cria (criado=true); as seguintes não duplicam
// e devolvem a linha existente (criado=false). Espelha o PgRascunhoRepo real.
class InMemRascunhoRepo implements IRascunhoRepository {
  private porMessageId = new Map<string, PedidoRascunho>();
  private seq = 0;

  async upsert(r: NovoPedidoRascunho): Promise<ResultadoUpsertRascunho> {
    const existente = this.porMessageId.get(r.messageId);
    if (existente) return { rascunho: existente, criado: false };
    const linha = {
      id: ++this.seq,
      messageId: r.messageId,
      emailCru: r.emailCru,
      jsonExtraido: r.jsonExtraido ?? null,
      remetenteEmail: r.remetenteEmail ?? null,
      remetenteNome: r.remetenteNome ?? null,
      confiancaGeral: r.confiancaGeral ?? null,
      statusTriagem: r.statusTriagem ?? "pendente",
      temAnexo: r.temAnexo ?? false,
      pedidoId: r.pedidoId ?? null,
      criadoEm: new Date(),
      processadoEm: null,
    } as PedidoRascunho;
    this.porMessageId.set(r.messageId, linha);
    return { rascunho: linha, criado: true };
  }

  async buscarPorMessageId(messageId: string): Promise<PedidoRascunho | null> {
    return this.porMessageId.get(messageId) ?? null;
  }

  get tamanho(): number {
    return this.porMessageId.size;
  }
}

let repo: InMemRascunhoRepo;
let service: RascunhoService;

beforeEach(() => {
  repo = new InMemRascunhoRepo();
  service = new RascunhoService(repo);
});

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
    expect(segundo.criado).toBe(false); // conflito não é erro — já existe
    expect(segundo.rascunho.id).toBe(primeiro.rascunho.id);
    expect(repo.tamanho).toBe(1); // não duplicou
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
