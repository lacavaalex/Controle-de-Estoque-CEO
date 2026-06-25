// estoque.js — EP02 Catálogo / Estoque (contrato §EP02)
import { api } from "./client.js";

function qs(filtros = {}) {
  const p = new URLSearchParams();
  if (filtros.texto) p.set("texto", filtros.texto);
  if (filtros.categoria) p.set("categoria", filtros.categoria);
  if (filtros.status) p.set("status", filtros.status);
  if (filtros.somenteComEstoque) p.set("somenteComEstoque", "true");
  if (filtros.somenteSemEstoque) p.set("somenteSemEstoque", "true");
  const s = p.toString();
  return s ? `?${s}` : "";
}

// GET /setores/:id/estoque → { estoque: [...] } (visão almoxarife/gestor, com status)
export async function estoqueDoSetor(setorId, filtros) {
  const data = await api.get(`/setores/${setorId}/estoque${qs(filtros)}`);
  return data.estoque ?? [];
}

// GET /setores/:id/catalogo → { catalogo: [...] } (visão solicitante, SEM lote)
export async function catalogoDoSetor(setorId, filtros) {
  const data = await api.get(`/setores/${setorId}/catalogo${qs(filtros)}`);
  return data.catalogo ?? [];
}

// GET /produtos/:id/lotes → { lotes: [...] } (não exibir a solicitante)
export async function lotesDoProduto(produtoId, setorId, incluirInativos = false) {
  const p = new URLSearchParams();
  if (setorId) p.set("setorId", setorId);
  if (incluirInativos) p.set("incluirInativos", "true");
  
  const q = p.toString() ? `?${p.toString()}` : "";
  const data = await api.get(`/produtos/${produtoId}/lotes${q}`);
  return data.lotes ?? [];
}

/**
 * US-EP03-03 — Dispara o abatimento de consumo clínico contra o lote
 */
export async function registrarConsumoLote(loteId, quantidade, observacao) {
  // Ajustado de client.post para api.post
  const resposta = await api.post(`/lotes/${loteId}/consumo`, { quantidade, observacao });
  return resposta.data;
}

/**
 * US-EP03-04 — Dispara a recontagem absoluta (ajuste de saldo) do lote
 */
export async function ajustarSaldoLote(loteId, quantidade, observacao) {
  // Ajustado de client.patch para api.patch
  const resposta = await api.patch(`/lotes/${loteId}/ajuste`, { quantidade, observacao });
  return resposta.data;
}

/**
 * US-EP07-01 — Segrega um lote ativo ou vencido no setor
 */
export async function segregarLote(loteId, observacao) {
  const resposta = await api.post(`/lotes/${loteId}/segregar`, { observacao });
  return resposta.data;
}

// GET /setores/:id/segregados → { segregados: [...] }
export async function segregadosDoSetor(setorId) {
  if (!setorId) return [];
  const data = await api.get(`/setores/${setorId}/segregados`);
  return data.segregados ?? [];
}

// US-EP02-05 + CEO-268 — Registra entrada de um novo lote (com itens avariados)
export async function registrarEntradaLote(produtoId, payload) {
  const resposta = await api.post(`/produtos/${produtoId}/lotes`, payload);
  return resposta.data;
}

// US-EP08-01 — Remove um lote para correção de registros
export async function removerLote(loteId) {
  const resposta = await api.del(`/lotes/${loteId}`);
  return resposta;
}