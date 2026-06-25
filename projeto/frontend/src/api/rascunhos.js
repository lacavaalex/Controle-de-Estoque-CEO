// rascunhos.js — Triagem do Agente de Email (EP08 / CEO-276).
// O agente cria rascunhos via POST /rascunhos (auth de serviço, não daqui).
// A triagem (almoxarife/gestor HO) lista, aprova (vira pedido) e descarta.
import { api } from "./client.js";

// GET /rascunhos?status=pendente { rascunhos: [...] }
export async function listarRascunhosPendentes() {
  const data = await api.get("/rascunhos?status=pendente");
  return data.rascunhos ?? [];
}

// POST /rascunhos/:id/aprovar { pedido: {...} }
// payload: { setorOrigemId, setorDestinoId, justificativa, itens }
// itens: cada um com produtoId XOR descricaoLivre (INV07), qtdSolicitada, unidade.
export async function aprovarRascunho(id, payload) {
  const data = await api.post(`/rascunhos/${id}/aprovar`, payload);
  return data.pedido;
}

// POST /rascunhos/:id/descartar 204 (sem corpo).
export async function descartarRascunho(id) {
  return api.post(`/rascunhos/${id}/descartar`, {});
}
