// dashboard.js — EP05 Dashboard (contrato §EP05, Pacote 2 )
// Pode ainda não estar implementado no backend; a tela trata 404 com fallback.
import { api } from "./client.js";

// GET /dashboard?setorId= KPIs
export function dashboard(setorId) {
  return api.get(`/dashboard?setorId=${setorId}`);
}

// GET /dashboard/movimentacoes?setorId=&limite=&tipo= → últimas movimentações (CEO-252)
export function ultimasMovimentacoes(setorId, { limite = 10, tipo } = {}) {
  const qs = new URLSearchParams({ setorId, limite });
  if (tipo) qs.set("tipo", tipo);
  return api.get(`/dashboard/movimentacoes?${qs.toString()}`);
}

// GET /dashboard/consumo-mensal?setorId=&meses= → série mensal por setor destino (CEO-249/253)
// setorId é o setor FORNECEDOR (ex.: HO); o backend soma as saídas dele por destino.
export function consumoMensal(setorId, { meses = 6 } = {}) {
  const qs = new URLSearchParams({ setorId, meses });
  return api.get(`/dashboard/consumo-mensal?${qs.toString()}`);
}
