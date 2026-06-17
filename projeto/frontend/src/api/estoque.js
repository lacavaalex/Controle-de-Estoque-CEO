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
export async function lotesDoProduto(produtoId, setorId) {
  const q = setorId ? `?setorId=${setorId}` : "";
  const data = await api.get(`/produtos/${produtoId}/lotes${q}`);
  return data.lotes ?? [];
}
