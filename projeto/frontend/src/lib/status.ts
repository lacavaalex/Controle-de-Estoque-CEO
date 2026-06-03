// Apresentação dos status de estoque na UI. Os rótulos espelham rotuloStatus()
// do backend (domain/estoque.ts); as classes usam os tokens de tema (theme.css).
import type { EstadoLote, EstadoValidade, StatusProduto } from "@/types/domain";

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
