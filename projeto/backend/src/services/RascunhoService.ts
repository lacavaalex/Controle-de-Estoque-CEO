// =============================================================================
// RascunhoService — admissão de solicitações por email (EP08 / ADR-0004).
//
// Princípio: admissão ≠ processamento. Este serviço só enche a antecâmara
// (pedido_rascunho). NÃO aplica RN10/INV nem cria pedido — rascunho não é
// pedido. A promoção rascunho→pedido roda na triagem (CEO-276), no backend,
// passando por todas as regras de domínio. Ver skill agente-dispensacao-rascunho.
// =============================================================================
import type {
  IRascunhoRepository,
  ResultadoUpsertRascunho,
} from "../interfaces/repository-interfaces/IRascunhoRepo.js";
import type { IPedidoRepository, PedidoComItens } from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { IUsuarioRepository } from "../interfaces/repository-interfaces/IUsuarioRepo.js";
import type { PedidoRascunho, Unidade } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { validarItensNovoPedido, type ItemEntrada } from "../domain/pedido.js";

// Identidade técnica do agente: pedido.solicitanteId aponta para este usuário-robô
// quando um rascunho vira pedido (o humano real fica em remetenteEmail/Nome).
// Seedado em db/seed.ts (ADR-0004 item 5).
export const EMAIL_USUARIO_ROBO = "dispensacao-agente@ufpe.br";

// Corpo que o agente (worker Python) envia em POST /rascunhos.
export interface DadosNovoRascunho {
  messageId: string;
  emailCru: string;
  remetenteEmail?: string | null;
  remetenteNome?: string | null;
  // Saída da tool submit_solicitacao (LLM). Estrutura validada na triagem, não aqui.
  jsonExtraido?: unknown;
  confiancaGeral?: number | null;
  temAnexo?: boolean;
}

// Item como a triagem o devolve (revisado/editado pelo almoxarife). XOR INV07.
export interface ItemTriagem {
  produtoId?: number | null;
  descricaoLivre?: string | null;
  qtdSolicitada: number;
  unidade: Unidade;
}

// O que o almoxarife informa ao APROVAR um rascunho (corpo de /aprovar).
export interface DadosAprovacao {
  setorOrigemId: number; // setor solicitante real — ESCOLHIDO na triagem (ADR-0004)
  setorDestinoId: number; // almoxarifado HO que atende
  justificativa: string; // do rascunho ou completada pelo almoxarife (RN09: >=10)
  itens: ItemTriagem[]; // itens revisados
}

export class RascunhoService {
  constructor(
    private rascunhoRepo: IRascunhoRepository,
    private pedidoRepo: IPedidoRepository,
    private usuarioRepo: IUsuarioRepository,
    private db: DB = defaultDb,
  ) {}

  /**
   * Valida o shape e grava de forma idempotente (ON CONFLICT por messageId).
   * Validação de admissão é mínima: o que garante a idempotência (messageId) e
   * a auditoria (emailCru). O resto é responsabilidade da triagem humana.
   */
  async registrar(dados: DadosNovoRascunho): Promise<ResultadoUpsertRascunho> {
    if (typeof dados.messageId !== "string" || dados.messageId.trim() === "") {
      throw new Error("messageId é obrigatório (idempotência por inbox pattern)");
    }
    if (typeof dados.emailCru !== "string" || dados.emailCru.trim() === "") {
      throw new Error("emailCru é obrigatório (auditoria e retreino)");
    }
    if (
      dados.confiancaGeral !== undefined &&
      dados.confiancaGeral !== null &&
      (typeof dados.confiancaGeral !== "number" ||
        dados.confiancaGeral < 0 ||
        dados.confiancaGeral > 1)
    ) {
      throw new Error("confiancaGeral deve estar entre 0 e 1");
    }

    return this.rascunhoRepo.upsert({
      messageId: dados.messageId.trim(),
      emailCru: dados.emailCru,
      remetenteEmail: dados.remetenteEmail ?? null,
      remetenteNome: dados.remetenteNome ?? null,
      // jsonb aceita qualquer JSON; a tipagem forte vem na triagem.
      jsonExtraido: dados.jsonExtraido ?? null,
      confiancaGeral: dados.confiancaGeral ?? null,
      ...(dados.temAnexo !== undefined ? { temAnexo: dados.temAnexo } : {}),
    });
  }

  // ─── Triagem (CEO-276) ──────────────────────────────────────────────────────

  /** Fila da triagem: rascunhos ainda não decididos. */
  async listarPendentes(): Promise<PedidoRascunho[]> {
    return this.rascunhoRepo.listarPorStatus("pendente");
  }

  /**
   * Promove um rascunho a pedido oficial — a fronteira admissão→processamento.
   * Tudo em UMA transação: cria pedido + itens E marca o rascunho aprovado.
   * Se qualquer passo falhar, rollback total (nunca rascunho aprovado sem pedido,
   * nem pedido órfão).
   *
   * Decisões travadas (ADR-0004 / skill agente-dispensacao-rascunho):
   *  - solicitanteId = usuário-robô (NÃO o almoxarife logado); o humano real vai
   *    em pedido.remetenteEmail/Nome, copiados do rascunho.
   *  - origemCanal = 'email'.
   *  - setorOrigemId é escolhido pelo almoxarife na triagem (vem em `dados`).
   *  - itens passam por RN09/INV07 (validarItensNovoPedido, compartilhado com criar).
   *  - status do pedido nasce 'pendente' (derivado — RN10), pelo PgPedidoRepo.
   */
  async promover(
    rascunhoId: number,
    dados: DadosAprovacao,
  ): Promise<PedidoComItens> {
    // Validações de cabeçalho fora da transação (falham cedo, sem segurar lock).
    if (!dados.justificativa || dados.justificativa.trim().length < 10) {
      throw new Error("Justificativa deve ter ao menos 10 caracteres (RN09)");
    }
    if (!Number.isInteger(dados.setorOrigemId) || !Number.isInteger(dados.setorDestinoId)) {
      throw new Error("setorOrigemId e setorDestinoId devem ser inteiros válidos");
    }
    if (dados.setorOrigemId === dados.setorDestinoId) {
      throw new Error("Setor de origem e destino não podem ser o mesmo");
    }
    // RN09/INV07 — itens revisados (mesma validação da criação direta).
    const itens = validarItensNovoPedido(dados.itens as ItemEntrada[]);

    // Resolve o usuário-robô (identidade técnica do solicitante). A ausência é
    // má configuração do servidor (seed não rodou), não erro do cliente — por
    // isso a mensagem evita "não encontrado" (que o controller mapeia para 404,
    // sugerindo que o RASCUNHO não existe). Aqui cai no 400 genérico.
    const robo = await this.usuarioRepo.buscarPorEmail(EMAIL_USUARIO_ROBO);
    if (!robo) {
      throw new Error(
        `Usuário-robô ${EMAIL_USUARIO_ROBO} não provisionado no banco (rode o seed — ADR-0004)`,
      );
    }

    return this.db.transaction(async (tx) => {
      // Trava o rascunho (FOR UPDATE) e garante que ainda está pendente — barra
      // aprovação dupla concorrente e re-promoção do que já foi decidido.
      const rascunho = await this.rascunhoRepo.buscarPorId(rascunhoId, tx);
      if (!rascunho) throw new Error(`Rascunho ${rascunhoId} não encontrado`);
      if (rascunho.statusTriagem !== "pendente") {
        throw new Error(
          `Rascunho ${rascunhoId} já foi ${rascunho.statusTriagem} (não pode promover de novo)`,
        );
      }

      // Cria o pedido NA MESMA transação (tx emprestada ao PgPedidoRepo).
      const pedido = await this.pedidoRepo.criar(
        {
          setorOrigemId: dados.setorOrigemId,
          setorDestinoId: dados.setorDestinoId,
          solicitanteId: robo.id,
          justificativa: dados.justificativa,
          origemCanal: "email",
          remetenteEmail: rascunho.remetenteEmail,
          remetenteNome: rascunho.remetenteNome,
        },
        itens,
        tx,
      );

      // Amarra o rascunho ao pedido recém-criado, ainda na transação.
      await this.rascunhoRepo.marcarAprovado(rascunhoId, pedido.id, tx);

      return pedido;
    });
  }

  /**
   * Descarta um rascunho (spam/duplicado/não-pedido). Não cria pedido.
   * O guard autoritativo é o UPDATE condicional (marcarDescartado só transiciona
   * se ainda 'pendente') — isso fecha a corrida com uma aprovação concorrente.
   * A leitura prévia serve só para um 404 limpo quando o rascunho nem existe.
   */
  async descartar(rascunhoId: number): Promise<void> {
    const rascunho = await this.rascunhoRepo.buscarPorId(rascunhoId);
    if (!rascunho) throw new Error(`Rascunho ${rascunhoId} não encontrado`);
    const transicionou = await this.rascunhoRepo.marcarDescartado(rascunhoId);
    if (!transicionou) {
      // Outra ação decidiu o rascunho entre a leitura e o update (ou ele já
      // estava decidido). Não sobrescreve — informa o conflito.
      throw new Error(
        `Rascunho ${rascunhoId} já foi decidido (não pode descartar)`,
      );
    }
  }
}
