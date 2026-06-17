// pedidos.js — EP04 Pedidos + EP03 expedição (contrato §EP04)
import { api } from "./client.js";

// POST /pedidos → { pedido: { id, status, itens } }
// itens: cada um com produtoId XOR descricaoLivre (regra XOR / INV07).
export async function criarPedido(payload) {
  const data = await api.post("/pedidos", payload);
  return data.pedido;
}

// GET /pedidos/:id → { pedido: {...} }
export async function obterPedido(id) {
  const data = await api.get(`/pedidos/${id}`);
  return data.pedido;
}

// GET /setores/:id/pedidos[?status=] → { pedidos: [...] }
export async function pedidosDoSetor(setorId, status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await api.get(`/setores/${setorId}/pedidos${q}`);
  return data.pedidos ?? [];
}

// POST /pedidos/:id/itens/:itemId/expedir → { item, movimentacoes, statusPedido }
// FEFO é automático no backend; corpo vazio.
export async function expedirItem(pedidoId, itemId) {
  return api.post(`/pedidos/${pedidoId}/itens/${itemId}/expedir`, {});
}
