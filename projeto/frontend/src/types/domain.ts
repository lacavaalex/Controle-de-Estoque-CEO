// =============================================================================
// Tipos de domínio do front — ESPELHAM o backend (projeto/backend, modelo v2).
//
// O backend deriva seus tipos do schema Drizzle (entities/index.ts). O front não
// importa Drizzle, então replicamos os enums como uniões literais. MANTENHA
// sincronizado com src/db/schema.ts do backend (os pgEnum). Se um enum mudar lá,
// mude aqui. (Idealmente, no futuro, um pacote de tipos compartilhado.)
// =============================================================================

export type TipoSetor = "almoxarifado" | "destinatario";

export type Perfil = "gestor" | "almoxarife" | "solicitante" | "dentista";

export type Categoria =
  | "EPI"
  | "Anestésico"
  | "Material Restaurador"
  | "Instrumentais"
  | "Higienização"
  | "Material Cirúrgico"
  | "Equipamento"
  | "Outros";

export type Unidade =
  | "caixa"
  | "tubo"
  | "seringa"
  | "kit"
  | "pacote"
  | "rolo"
  | "unidade"
  | "frasco"
  | "bastão"
  | "folha"
  | "par";

export type EstadoLote = "ativo" | "vencido" | "segregado";

// Estado de validade derivado pela RN05 (backend domain/estoque.ts).
export type EstadoValidade = "vencido" | "vencendo" | "atencao" | "ok";

// Status agregado do produto calculado pelo backend (domain/estoque.ts, RN06).
export type StatusProduto =
  | "indisponivel"
  | "vencido"
  | "vencendo"
  | "atencao"
  | "critico"
  | "baixo"
  | "excessivo"
  | "normal";

export type StatusItem =
  | "pendente"
  | "aguardando_reposicao"
  | "atendido_integral"
  | "atendido_parcial"
  | "nao_atendido";

export type StatusPedido =
  | "pendente"
  | "em_processamento"
  | "atendido_integral"
  | "atendido_parcial"
  | "nao_atendido"
  | "aguardando_reposicao";

export type MotivoDivergencia =
  | "falta_estoque"
  | "racionalizacao_setor"
  | "lote_indisponivel"
  | "outros";

// ─── Identidade autenticada (payload do backend em /login e /eu) ─────────────
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  perfil: Perfil;
  setorId: number;
  trocarSenha: boolean;
}

export interface Identidade {
  usuarioId: number;
  perfil: Perfil;
  setorId: number;
  setorTipo: TipoSetor;
}

// ─── Linha da tabela "Estoque" (GET /setores/:setorId/estoque) ───────────────
// Espelha ProdutoComEstoque do EstoqueService do backend.
export interface ProdutoComEstoque {
  produtoId: number;
  nome: string;
  categoria: Categoria;
  unidade: Unidade;
  estoqueMinimo: number;
  estoqueMaximo: number;
  localizacao: string | null;
  qtdTotal: number;
  status: StatusProduto;
}

// ─── Lote (GET /produtos/:id/lotes) ──────────────────────────────────────────
// Espelha a entidade Lote do backend (db/schema.ts). Dates vêm como ISO string.
// O controller (LoteController.listarPorProduto) enriquece cada lote com
// `estadoValidade` (RN05).
export interface LoteComEstado {
  id: number;
  produtoId: number;
  setorId: number;
  numeroLote: string;
  fabricacao: string | null;
  validade: string;
  quantidade: number;
  estado: EstadoLote;
  dataSegregacao: string | null;
  observacaoSegregacao: string | null;
  estadoValidade: EstadoValidade;
}

// ─── Setor (GET /setores) ────────────────────────────────────────────────────
export interface Setor {
  id: number;
  nome: string;
  tipo: TipoSetor;
  emailInstitucional: string;
}

// ─── Pedido (EP04) ───────────────────────────────────────────────────────────
// Item de um pedido. `desdobramentos` = quebras por lote (RF05.17), só presentes
// em itens RAIZ que foram expedidos a partir de >1 lote.
export interface ItemDoPedido {
  id: number;
  pedidoId: string;
  produtoId: number | null;
  descricaoLivre: string | null;
  qtdSolicitada: number;
  qtdExpedida: number | null;
  loteExpedidoId: number | null;
  unidade: Unidade;
  statusItem: StatusItem;
  motivoDivergencia: MotivoDivergencia | null;
  observacaoMotivo: string | null;
  itemPaiId: number | null;
  processadoPorId: number | null;
  dataProcessamento: string | null;
  desdobramentos?: ItemDoPedido[];
}

// Agregado de leitura (GET /pedidos/:id e /setores/:setorId/pedidos).
export interface PedidoComItens {
  id: string; // PED-NNN
  setorOrigemId: number;
  setorDestinoId: number;
  solicitanteId: number;
  dataCriacao: string;
  justificativa: string;
  status: StatusPedido;
  itens: ItemDoPedido[];
}

// ─── Payload de criação (POST /pedidos) ──────────────────────────────────────
// XOR (INV07): exatamente um entre produtoId e descricaoLivre por item.
export interface ItemNovoPedido {
  produtoId?: number;
  descricaoLivre?: string;
  qtdSolicitada: number;
  unidade: Unidade;
}

export interface NovoPedido {
  setorOrigemId: number;
  setorDestinoId: number;
  justificativa: string;
  itens: ItemNovoPedido[];
}
