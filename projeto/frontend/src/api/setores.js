// setores.js — Setores (contrato §Setores)
import { api } from "./client.js";

// GET /setores → { setores: [ { id, nome, tipo, emailInstitucional } ] }
export async function listarSetores() {
  const data = await api.get("/setores");
  return data.setores ?? [];
}
