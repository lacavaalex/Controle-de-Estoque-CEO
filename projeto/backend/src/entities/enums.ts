// Enums do domínio CEO Estoque UFPE — espelham os TYPE ENUM do PostgreSQL (migration 001)
// Union types + arrays permitem validação em runtime e iteração em formulários.

// RN01, INV06
export type Role = "gestao" | "almoxarife" | "dentista";
export const ROLES: Role[] = ["gestao", "almoxarife", "dentista"];

// RN02: catálogo fechado de categorias (PR05)
export type CategoriaItem =
  | "EPI"
  | "Anestésico"
  | "Material Restaurador"
  | "Instrumentais"
  | "Higienização"
  | "Material Cirúrgico"
  | "Outros";
export const CATEGORIAS: CategoriaItem[] = [
  "EPI",
  "Anestésico",
  "Material Restaurador",
  "Instrumentais",
  "Higienização",
  "Material Cirúrgico",
  "Outros",
];

// §2.2 e glossário: unidades de medida
export type UnidadeMedida =
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
export const UNIDADES: UnidadeMedida[] = [
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
];

// RN10: ciclo de vida da solicitação
export type StatusSolicitacao = "pendente" | "aprovada" | "negada";
export const STATUS_SOLICITACAO: StatusSolicitacao[] = [
  "pendente",
  "aprovada",
  "negada",
];

// §2.5: tipos de movimentação
export type TipoMovimentacao = "entrada" | "saida" | "ajuste";
export const TIPOS_MOVIMENTACAO: TipoMovimentacao[] = [
  "entrada",
  "saida",
  "ajuste",
];

// §2.5: destinos válidos no MVP
export type LocalEstoque = "Dispensação" | "CEO";
export const LOCAIS_ESTOQUE: LocalEstoque[] = ["Dispensação", "CEO"];

// Status calculados em runtime (não persistidos)

// RN03–RN06: status do item na Dispensação
export type StatusItemDispensacao =
  | "Normal"
  | "Baixo"
  | "Crítico"
  | "Atenção"
  | "Vencendo"
  | "Vencido"
  | "Excessivo";

// RN07: status do item no CEO
export type StatusEstoqueCeo = "Disponível" | "Baixo" | "Crítico" | "Indisponível";
