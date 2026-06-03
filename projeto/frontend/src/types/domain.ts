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
