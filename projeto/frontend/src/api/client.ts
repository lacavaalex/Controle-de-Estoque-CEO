// =============================================================================
// Cliente HTTP — fala com o backend (projeto/backend, Express na porta 3000).
//
// Em dev, o Vite faz proxy de /api -> http://localhost:3000 (ver vite.config.ts),
// então usamos o prefixo /api e não há problema de CORS no desenvolvimento.
// Em produção, VITE_API_BASE_URL aponta para a origem real do backend.
//
// Auth: JWT (ADR-0005). O token vai no header Authorization: Bearer <token>.
// O backend devolve erros no formato { mensagem: string } (ou { error: string }).
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const TOKEN_KEY = "ceo.token";

// Tradeoff (ADR-0005): o JWT fica em localStorage — simples e stateless, mas
// legível por script injetado (XSS). Aceitável no piloto; se o requisito de
// segurança subir, migrar para cookie httpOnly + CSRF no backend.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token === null) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Por padrão anexa o Bearer token; desligue em rotas públicas (login). */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    const mensagem =
      (typeof data === "object" &&
        data !== null &&
        ("mensagem" in data || "error" in data) &&
        String((data as Record<string, unknown>).mensagem ?? (data as Record<string, unknown>).error)) ||
      `Erro ${res.status}`;
    throw new ApiError(res.status, mensagem);
  }

  // 200 sem corpo (raro) — devolve undefined tipado.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
