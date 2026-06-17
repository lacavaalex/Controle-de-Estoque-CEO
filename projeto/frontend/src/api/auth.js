// auth.js — EP01 Auth (contrato §EP01)
import { api, session } from "./client.js";

// POST /login → { usuario, token }. Não envia Bearer.
export async function login(email, senha) {
  const data = await api.post("/login", { email, senha }, { auth: false });
  session.set(data.token, data.usuario);
  return data;
}

// GET /eu → { usuario: { id, nome, email, perfil, setorId, cargo } }
export async function eu() {
  const data = await api.get("/eu");
  if (data?.usuario) session.set(null, data.usuario);
  return data.usuario;
}

// POST /logout (best-effort) + limpa sessão local sempre.
export async function logout() {
  try { await api.post("/logout"); } catch { /* ignora erro de rede no logout */ }
  session.clear();
}

// POST /usuarios — provisionar (gestor only) → { usuario, senhaProvisoria }
export function provisionarUsuario(dados) {
  return api.post("/usuarios", dados);
}
