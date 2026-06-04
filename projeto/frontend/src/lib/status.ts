// Apresentação dos status de estoque na UI. Os rótulos espelham rotuloStatus()
// do backend (domain/estoque.ts); as classes usam os tokens de tema (theme.css).
import type {
  EstadoLote,
  EstadoValidade,
  MotivoDivergencia,
  StatusItem,
  StatusPedido,
  StatusProduto,
} from "@/types/domain";

// Rótulos PT-BR — idênticos a rotuloStatus() do backend.
const ROTULOS: Record<StatusProduto, string> = {
  indisponivel: "Indisponível",
  vencido: "Vencido",
  vencendo: "Vencendo",
  atencao: "Atenção",
  critico: "Crítico",
  baixo: "Baixo",
  excessivo: "Excessivo",
  normal: "Normal",
};

// Classe Tailwind para o badge de cada status. Cada cor é um token --color-status-*
// definido em theme.css (1:1 com os 8 status do domínio).
const CLASSES: Record<StatusProduto, string> = {
  indisponivel: "bg-status-indisponivel/15 text-status-indisponivel",
  vencido: "bg-status-vencido/15 text-status-vencido",
  vencendo: "bg-status-vencendo/15 text-status-vencendo",
  atencao: "bg-status-atencao/15 text-status-atencao",
  critico: "bg-status-critico/15 text-status-critico",
  baixo: "bg-status-baixo/15 text-status-baixo",
  excessivo: "bg-status-excessivo/15 text-status-excessivo",
  normal: "bg-status-normal/15 text-status-normal",
};

export function rotuloStatus(status: StatusProduto): string {
  return ROTULOS[status];
}

export function classeBadgeStatus(status: StatusProduto): string {
  return CLASSES[status];
}

// ─── Lote: estado de validade (RN05) ─────────────────────────────────────────
const ROTULOS_VALIDADE: Record<EstadoValidade, string> = {
  vencido: "Vencido",
  vencendo: "Vencendo",
  atencao: "Atenção",
  ok: "OK",
};

const CLASSES_VALIDADE: Record<EstadoValidade, string> = {
  vencido: "bg-status-vencido/15 text-status-vencido",
  vencendo: "bg-status-vencendo/15 text-status-vencendo",
  atencao: "bg-status-atencao/15 text-status-atencao",
  ok: "bg-status-normal/15 text-status-normal",
};

export function rotuloValidade(estado: EstadoValidade): string {
  return ROTULOS_VALIDADE[estado];
}

export function classeBadgeValidade(estado: EstadoValidade): string {
  return CLASSES_VALIDADE[estado];
}

// ─── Lote: estado do lote (RN17) ─────────────────────────────────────────────
const ROTULOS_ESTADO_LOTE: Record<EstadoLote, string> = {
  ativo: "Ativo",
  vencido: "Vencido",
  segregado: "Segregado",
};

export function rotuloEstadoLote(estado: EstadoLote): string {
  return ROTULOS_ESTADO_LOTE[estado];
}

// ─── Pedido: status do pedido (RN10) ─────────────────────────────────────────
// Sem tokens próprios no tema: reaproveitamos a paleta de status de estoque por
// semântica (atendido=verde, parcial/aguardando=amarelo, não atendido=vermelho).
const ROTULOS_PEDIDO: Record<StatusPedido, string> = {
  pendente: "Pendente",
  em_processamento: "Em processamento",
  atendido_integral: "Atendido integral",
  atendido_parcial: "Atendido parcial",
  nao_atendido: "Não atendido",
  aguardando_reposicao: "Aguardando reposição",
};

const CLASSES_PEDIDO: Record<StatusPedido, string> = {
  pendente: "bg-status-indisponivel/15 text-status-indisponivel",
  em_processamento: "bg-status-vencendo/15 text-status-vencendo",
  atendido_integral: "bg-status-normal/15 text-status-normal",
  atendido_parcial: "bg-status-baixo/15 text-status-baixo",
  nao_atendido: "bg-status-critico/15 text-status-critico",
  aguardando_reposicao: "bg-status-atencao/15 text-status-atencao",
};

export function rotuloPedido(status: StatusPedido): string {
  return ROTULOS_PEDIDO[status];
}

export function classeBadgePedido(status: StatusPedido): string {
  return CLASSES_PEDIDO[status];
}

// ─── Item do pedido: status do item (RN16) ───────────────────────────────────
const ROTULOS_ITEM: Record<StatusItem, string> = {
  pendente: "Pendente",
  aguardando_reposicao: "Aguardando reposição",
  atendido_integral: "Atendido integral",
  atendido_parcial: "Atendido parcial",
  nao_atendido: "Não atendido",
};

const CLASSES_ITEM: Record<StatusItem, string> = {
  pendente: "bg-status-indisponivel/15 text-status-indisponivel",
  aguardando_reposicao: "bg-status-atencao/15 text-status-atencao",
  atendido_integral: "bg-status-normal/15 text-status-normal",
  atendido_parcial: "bg-status-baixo/15 text-status-baixo",
  nao_atendido: "bg-status-critico/15 text-status-critico",
};

export function rotuloItem(status: StatusItem): string {
  return ROTULOS_ITEM[status];
}

export function classeBadgeItem(status: StatusItem): string {
  return CLASSES_ITEM[status];
}

// ─── Item: motivo de divergência (RN16/INV03) ────────────────────────────────
const ROTULOS_MOTIVO: Record<MotivoDivergencia, string> = {
  falta_estoque: "Falta de estoque",
  racionalizacao_setor: "Racionalização do setor",
  lote_indisponivel: "Lote indisponível",
  outros: "Outros",
};

export function rotuloMotivo(motivo: MotivoDivergencia): string {
  return ROTULOS_MOTIVO[motivo];
}
