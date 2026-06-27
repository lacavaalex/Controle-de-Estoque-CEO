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

// Escapa um campo para CSV (RFC 4180): envolve em aspas se contém ; , aspas ou
// quebra de linha, e dobra as aspas internas.
function campoCsv(valor) {
  const s = valor == null ? "" : String(valor);
  return /[";,\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Cabeçalhos do CSV do log, na ordem das colunas exportadas.
const CSV_CABECALHO = ["Quando", "Tipo", "Produto", "Quantidade", "Origem", "Destino", "Retirado por"];

/**
 * Converte a lista de movimentações (shape de UltimaMovimentacao) em texto CSV
 * (CEO-252 — exportar log; almoxarife vive em planilha). Usa ';' como separador,
 * que o Excel pt-BR abre direto, e BOM para acentos não quebrarem.
 */
export function movimentacoesParaCsv(movimentacoes) {
  const linhas = [CSV_CABECALHO.join(";")];
  for (const m of movimentacoes ?? []) {
    linhas.push(
      [
        formatarDataHora(m.data),
        ROTULO_TIPO[m.tipo] || m.tipo,
        m.produtoNome,
        m.quantidade,
        m.setorOrigemNome,
        m.setorDestinoNome ?? "",
        m.retiradoPor ?? "",
      ]
        .map(campoCsv)
        .join(";"),
    );
  }
  return "﻿" + linhas.join("\r\n");
}
