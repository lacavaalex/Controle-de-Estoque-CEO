// movimentacoes.js — rótulos, tons e formatação compartilhados do log de
// movimentações (CEO-252). Reusado no painel do Dashboard e na página /movimentacoes.

// Tipos de movimentação do domínio (ver TipoMovimentacao no backend).
export const TIPOS_MOVIMENTACAO = ["entrada", "saida", "ajuste", "consumo", "segregacao"];

// Rótulo legível em pt-BR para cada tipo.
export const ROTULO_TIPO = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
  consumo: "Consumo",
  segregacao: "Segregação",
};

// Classe de badge por tipo (definidas em styles/index.css, prefixo mv-).
export const CLASSE_TIPO = {
  entrada: "mv-entrada",
  saida: "mv-saida",
  ajuste: "mv-ajuste",
  consumo: "mv-consumo",
  segregacao: "mv-segregacao",
};

/** Formata um ISO em data+hora curtas pt-BR; "—" se ausente/ inválido. */
export function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
