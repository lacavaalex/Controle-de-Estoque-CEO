// ============================================================
// client.js — núcleo do cliente HTTP da API
// Contrato: docs/PO/07-roadmap-metricas/05-contrato-api.md
//  - Base: /api (proxy do Vite → :3000), ou VITE_API_BASE
//  - Auth: Authorization: Bearer <token> em tudo, exceto /login
//  - Erros: 4xx { mensagem } (negócio/permissão) ou { error } (interno)
// ============================================================

const BASE = import.meta.env.VITE_API_BASE || "/api";

const TOKEN_KEY = "ceo_token";
const USER_KEY = "ceo_usuario";

// ---- Sessão (token + usuário no localStorage) ----
export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  set: (token, usuario) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// Erro de API com a mensagem amigável já extraída e o status HTTP.
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(method, path, body, { auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = session.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Erro de conexão. Verifique se o servidor (API) está no ar.",
      0,
      null,
    );
  }

  // 204 / corpo vazio
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    // Sessão expirada/!inválida → limpa e sinaliza para a app redirecionar.
    if (res.status === 401) {
      session.clear();
    }
    const msg =
      (data && (data.mensagem || data.error)) ||
      `Erro ${res.status}.`;
    throw new ApiError(msg, res.status, data);
  }

  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export const api = {
  get: (path, opts) => request("GET", path, undefined, opts),
  post: (path, body, opts) => request("POST", path, body, opts),
  patch: (path, body, opts) => request("PATCH", path, body, opts),
  put: (path, body, opts) => request("PUT", path, body, opts),
  del: (path, opts) => request("DELETE", path, undefined, opts),
};
