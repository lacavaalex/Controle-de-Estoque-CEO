// constants.js — enums do contrato (para selects do front)
// Fonte: docs/PO/07-roadmap-metricas/05-contrato-api.md §Enums

export const CATEGORIAS = [
  "EPI", "Anestésico", "Material Restaurador", "Instrumentais",
  "Higienização", "Material Cirúrgico", "Equipamento", "Outros",
];

export const UNIDADES = [
  "caixa", "tubo", "seringa", "kit", "pacote", "rolo",
  "unidade", "frasco", "bastão", "folha", "par",
];

// status agregado de produto no estoque (rotuloStatus)
export const STATUS_ESTOQUE = [
  "Crítico", "Baixo", "Vencendo", "Vencido", "OK", "Indisponível",
];

// status de pedido (derivado)
export const STATUS_PEDIDO = [
  "pendente", "em_processamento", "atendido_integral",
  "atendido_parcial", "nao_atendido", "aguardando_reposicao",
];

// Mapa de status de estoque → classe CSS do badge (ver index.css)
export const STATUS_CLASS = {
  "Crítico": "st-critico",
  "Baixo": "st-baixo",
  "Vencendo": "st-vencendo",
  "Vencido": "st-vencido",
  "OK": "st-ok",
  "Indisponível": "st-indisponivel",
};

// Rótulos amigáveis para status de pedido/item
export const ROTULO_STATUS = {
  pendente: "Pendente",
  em_processamento: "Em processamento",
  atendido_integral: "Atendido integral",
  atendido_parcial: "Atendido parcial",
  nao_atendido: "Não atendido",
  aguardando_reposicao: "Aguardando reposição",
};

// Mapa status pedido/item → classe de badge
export const STATUS_PEDIDO_CLASS = {
  pendente: "st-indisponivel",
  em_processamento: "st-vencendo",
  atendido_integral: "st-ok",
  atendido_parcial: "st-baixo",
  nao_atendido: "st-critico",
  aguardando_reposicao: "st-vencido",
};

export const PERFIL = {
  GESTOR: "gestor",
  ALMOXARIFE: "almoxarife",
  SOLICITANTE: "solicitante",
  DENTISTA: "dentista",
};
