// Schema físico v2 (Drizzle ORM) — CEO-UFPE
// Deriva de docs/PO/06-dominio-regras/03-modelo-conceitual.md (v2) e das
// regras RN01–RN20 / invariantes INV01–INV09.
//
// Convenções:
// - Nomes de tabela/coluna em snake_case PT-BR (linguagem do projeto).
// - Enums de domínio como enums nativos do Postgres.
// - Invariantes mapeados como CHECK/UNIQUE/FK onde fazem sentido no schema;
//   os que dependem de estado calculado em runtime (ex.: status derivado do
//   pedido) ficam nas funções de domínio da Etapa 2.
import {
  pgTable,
  pgEnum,
  pgSequence,
  serial,
  text,
  integer,
  date,
  timestamp,
  boolean,
  varchar,
  jsonb,
  real,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Sequências para IDs textuais legíveis (MOV-NNN, PED-NNN)
// Pedido e Movimentação usam PK textual com prefixo. A numeração vem destas
// sequências; a formatação ('MOV-' || lpad(...)) é feita no repositório.
export const seqMovimentacao = pgSequence("seq_movimentacao", { startWith: 1 });
export const seqPedido = pgSequence("seq_pedido", { startWith: 1 });

// Enums de domínio

// Setor.tipo — almoxarifado (HO) fornece; destinatario (CEO, CME...) recebe.
export const tipoSetorEnum = pgEnum("tipo_setor", ["almoxarifado", "destinatario"]);

// Usuario.perfil — RN01. `dentista` previsto para fase 2.
export const perfilEnum = pgEnum("perfil", [
  "gestor",
  "almoxarife",
  "solicitante",
  "dentista",
]);

// Produto.categoria — RN02 (conjunto fechado). `Equipamento` é especial.
export const categoriaEnum = pgEnum("categoria", [
  "EPI",
  "Anestésico",
  "Material Restaurador",
  "Instrumentais",
  "Higienização",
  "Material Cirúrgico",
  "Equipamento",
  "Outros",
]);

// Produto.unidade — conjunto fechado do modelo conceitual 2.3.
export const unidadeEnum = pgEnum("unidade", [
  "caixa",
  "tubo",
  "seringa",
  "kit",
  "pacote",
  "rolo",
  "unidade",
  "frasco",
  "bastão",
  "folha",
  "par",
]);

// Lote.estado — RN17. ativo vencido segregado.
export const estadoLoteEnum = pgEnum("estado_lote", ["ativo", "vencido", "segregado"]);

// ItemDoPedido.status_item — RN10.
export const statusItemEnum = pgEnum("status_item", [
  "pendente",
  "aguardando_reposicao",
  "atendido_integral",
  "atendido_parcial",
  "nao_atendido",
]);

// Pedido.status (derivado) — RN10.
export const statusPedidoEnum = pgEnum("status_pedido", [
  "pendente",
  "em_processamento",
  "atendido_integral",
  "atendido_parcial",
  "nao_atendido",
  "aguardando_reposicao",
]);

// ItemDoPedido.motivo_divergencia — RN16.
export const motivoDivergenciaEnum = pgEnum("motivo_divergencia", [
  "falta_estoque",
  "racionalizacao_setor",
  "lote_indisponivel",
  "outros",
]);

// Movimentacao.tipo — modelo conceitual 2.7.
export const tipoMovimentacaoEnum = pgEnum("tipo_movimentacao", [
  "entrada",
  "saida",
  "ajuste",
  "consumo",
  "segregacao",
]);

// Enums do Agente de Email da Dispensação (EP08 / ADR-0004)
// Aditivos: não alteram nenhum enum acima nem a derivação de status (RN10).

// Pedido.origemCanal — por onde o pedido entrou. 'sistema' = digitado por um
// usuário logado (fluxo normal); 'email' = admitido pelo agente via rascunho.
export const origemCanalEnum = pgEnum("origem_canal", ["sistema", "email"]);

// PedidoRascunho.statusTriagem — ciclo de ADMISSÃO (não de processamento).
// Enum próprio do rascunho, separado de statusPedidoEnum (ADR-0004).
export const statusTriagemEnum = pgEnum("status_triagem", [
  "pendente",
  "aprovado",
  "descartado",
]);

// Setor
export const setor = pgTable("setor", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: tipoSetorEnum("tipo").notNull(),
  emailInstitucional: text("email_institucional"),
});

// Usuário
// INV06: exatamente um perfil e um setor (garantido por colunas NOT NULL).
export const usuario = pgTable(
  "usuario",
  {
    id: serial("id").primaryKey(),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    cargo: text("cargo").notNull(),
    perfil: perfilEnum("perfil").notNull(),
    setorId: integer("setor_id")
      .notNull()
      .references(() => setor.id),
    avatar: varchar("avatar", { length: 2 }),
    // Auth (Etapa 3): hash de senha (bcrypt/argon2) — nunca texto puro.
    senhaHash: text("senha_hash"),
    trocarSenha: boolean("trocar_senha").notNull().default(false),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("usuario_email_unico").on(t.email),
    // Login institucional @ufpe.br (RNF03 / RN01).
    check("usuario_email_ufpe", sql`${t.email} LIKE '%@ufpe.br'`),
  ],
);

// Produto (catálogo)
export const produto = pgTable(
  "produto",
  {
    id: serial("id").primaryKey(),
    nome: text("nome").notNull(),
    categoria: categoriaEnum("categoria").notNull(),
    unidade: unidadeEnum("unidade").notNull(),
    estoqueMinimo: integer("estoque_minimo").notNull().default(0),
    estoqueMaximo: integer("estoque_maximo").notNull().default(9999),
    localizacao: text("localizacao"),
    fornecedor: text("fornecedor"),
  },
  (t) => [
    check("produto_estoque_minimo_nao_negativo", sql`${t.estoqueMinimo} >= 0`),
    check("produto_estoque_maximo_nao_negativo", sql`${t.estoqueMaximo} >= 0`),
  ],
);

// Lote
// INV04: referencia Produto + exatamente um Setor (FKs NOT NULL).
// INV05: quantidade sempre >= 0 (CHECK).
export const lote = pgTable(
  "lote",
  {
    id: serial("id").primaryKey(),
    produtoId: integer("produto_id").notNull().references(() => produto.id),
    setorId: integer("setor_id").notNull().references(() => setor.id),
    numeroLote: text("numero_lote").notNull(),
    fabricacao: date("fabricacao"),
    validade: date("validade").notNull(),
    quantidade: integer("quantidade").notNull(),
    qtdDanificada: integer("qtd_danificada").notNull().default(0),
    obsDanificada: text("obs_danificada"),
    
    estado: estadoLoteEnum("estado").notNull().default("ativo"),
    dataSegregacao: date("data_segregacao"),
    observacaoSegregacao: text("observacao_segregacao"),
  },
  (t) => [
    check("lote_quantidade_nao_negativa", sql`${t.quantidade} >= 0`),
    // RN17: lote segregado deve ter data de segregação.
    check(
      "lote_segregado_tem_data",
      sql`(${t.estado} <> 'segregado') OR (${t.dataSegregacao} IS NOT NULL)`,
    ),
    // RN19/INV09: a entrada-CEO via expedição soma num lote-CEO de mesmo
    // (produto, setor, numeroLote) ou cria um novo. O índice único torna esse
    // upsert seguro sob concorrência (junto com o SELECT ... FOR UPDATE).
    uniqueIndex("lote_produto_setor_numero_unico").on(
      t.produtoId,
      t.setorId,
      t.numeroLote,
    ),
  ],
);

// Pedido (cabeçalho)
export const pedido = pgTable(
  "pedido",
  {
    id: text("id").primaryKey(), // PED-NNN
    setorOrigemId: integer("setor_origem_id")
      .notNull()
      .references(() => setor.id),
    setorDestinoId: integer("setor_destino_id")
      .notNull()
      .references(() => setor.id),
    solicitanteId: integer("solicitante_id")
      .notNull()
      .references(() => usuario.id),
    dataCriacao: timestamp("data_criacao", { withTimezone: true }).notNull().defaultNow(),
    justificativa: text("justificativa").notNull(),
    status: statusPedidoEnum("status").notNull().default("pendente"),
    // Origem do pedido (EP08 / ADR-0004) — colunas aditivas
    // Default 'sistema' preserva os pedidos existentes e o seed. Quando um
    // rascunho é promovido na triagem, vira 'email' e guarda o humano real.
    // O solicitanteId continua sendo o usuário-robô; quem pediu de fato mora
    // aqui (sem FK, sem CHECK @ufpe.br — o remetente externo nunca é usuario).
    origemCanal: origemCanalEnum("origem_canal").notNull().default("sistema"),
    remetenteEmail: text("remetente_email"),
    remetenteNome: text("remetente_nome"),
  },
  (t) => [
    // RN09: justificativa >= 10 caracteres.
    check("pedido_justificativa_minima", sql`char_length(${t.justificativa}) >= 10`),
  ],
);

// ItemDoPedido (linhas)
// INV07: exatamente um entre produto_id OU descricao_livre (XOR via CHECK).
// INV03: qtd_expedida != qtd_solicitada (processado) => motivo_divergencia.
export const itemDoPedido = pgTable(
  "item_do_pedido",
  {
    id: serial("id").primaryKey(),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedido.id, { onDelete: "cascade" }),
    produtoId: integer("produto_id").references(() => produto.id),
    descricaoLivre: text("descricao_livre"),
    qtdSolicitada: integer("qtd_solicitada").notNull(),
    qtdExpedida: integer("qtd_expedida"),
    loteExpedidoId: integer("lote_expedido_id").references(() => lote.id),
    unidade: unidadeEnum("unidade").notNull(),
    statusItem: statusItemEnum("status_item").notNull().default("pendente"),
    motivoDivergencia: motivoDivergenciaEnum("motivo_divergencia"),
    observacaoMotivo: text("observacao_motivo"),
    // Item desdobrado em múltiplos lotes (RF05.17): aponta para o item original.
    itemPaiId: integer("item_pai_id"),
    processadoPorId: integer("processado_por_id").references(() => usuario.id),
    dataProcessamento: timestamp("data_processamento", { withTimezone: true }),
  },
  (t) => [
    // RN09: qtd_solicitada >= 1.
    check("item_qtd_solicitada_minima", sql`${t.qtdSolicitada} >= 1`),
    check(
      "item_qtd_expedida_nao_negativa",
      sql`${t.qtdExpedida} IS NULL OR ${t.qtdExpedida} >= 0`,
    ),
    // INV07: XOR entre produto_id e descricao_livre.
    check(
      "item_produto_xor_descricao",
      sql`(${t.produtoId} IS NOT NULL) <> (${t.descricaoLivre} IS NOT NULL)`,
    ),
  ],
);

// PedidoRascunho (antecâmara do Agente de Email — EP08 / ADR-0004)
// Admissão ≠ processamento: o agente é um produtor de rascunhos sujos (LLM,
// email cru, confiança). O backend continua dono único do banco. Esta tabela
// NÃO participa de RN10/INV — o rascunho não é pedido; só na aprovação do
// almoxarife (triagem, CEO-276) é que se cria o `pedido` + `item_do_pedido`
// oficiais passando por todas as regras de domínio. Ver skill
// agente-dispensacao-rascunho.
export const pedidoRascunho = pgTable("pedido_rascunho", {
  id: serial("id").primaryKey(),
  // Idempotência (inbox pattern): UNIQUE INSERT ON CONFLICT DO NOTHING no
  // POST /rascunhos. Message-ID original (preservado pelo auto-forward Plano A)
  // ou, em fallback, hash de conteúdo — nunca nulo. Ver skill email-ingestion-imap.
  messageId: text("message_id").notNull(),
  // Corpo + headers relevantes do email, para auditoria e retreino do extrator.
  emailCru: text("email_cru").notNull(),
  // Saída estruturada da tool `submit_solicitacao` (LLM). Revisada na triagem.
  jsonExtraido: jsonb("json_extraido"),
  // Humano real por trás do email (de From:/Reply-To/corpo). Sem FK, sem CHECK:
  // o solicitante externo não é `usuario` (o login @ufpe.br segue blindado).
  remetenteEmail: text("remetente_email"),
  remetenteNome: text("remetente_nome"),
  confiancaGeral: real("confianca_geral"),
  statusTriagem: statusTriagemEnum("status_triagem").notNull().default("pendente"),
  // Flag "revisar manual": anexo (PDF/imagem) fica fora do MVP — sem OCR ainda.
  temAnexo: boolean("tem_anexo").notNull().default(false),
  // Preenchido na aprovação: liga o rascunho ao pedido oficial que ele gerou.
  pedidoId: text("pedido_id").references(() => pedido.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  processadoEm: timestamp("processado_em", { withTimezone: true }),
}, (t) => [
  // Idempotência por Message-ID/hash (ver acima): o mesmo email nunca vira dois
  // rascunhos. Índice único habilita o ON CONFLICT (message_id) DO NOTHING.
  uniqueIndex("pedido_rascunho_message_id_unico").on(t.messageId),
]);

// Movimentação (auditoria — RN11 / RNF07.1)
// INV01: referencia um Lote existente (FK NOT NULL).
export const movimentacao = pgTable("movimentacao", {
  id: text("id").primaryKey(), // MOV-NNN
  tipo: tipoMovimentacaoEnum("tipo").notNull(),
  loteId: integer("lote_id")
    .notNull()
    .references(() => lote.id),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produto.id),
  quantidade: integer("quantidade").notNull(), // pode ser negativa (ajuste/consumo)
  setorOrigemId: integer("setor_origem_id")
    .notNull()
    .references(() => setor.id),
  setorDestinoId: integer("setor_destino_id").references(() => setor.id),
  responsavelId: integer("responsavel_id")
    .notNull()
    .references(() => usuario.id),
  data: timestamp("data", { withTimezone: true }).notNull().defaultNow(),
  pedidoId: text("pedido_id").references(() => pedido.id),
  observacao: text("observacao"),
});
