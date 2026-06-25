// dashboard.js — EP05 Dashboard (contrato §EP05, Pacote 2 )
// Pode ainda não estar implementado no backend; a tela trata 404 com fallback.
import { api } from "./client.js";

// GET /dashboard?setorId= KPIs
export function dashboard(setorId) {
  return api.get(`/dashboard?setorId=${setorId}`);
}
