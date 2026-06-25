import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, session, ApiError } from "./client.js";

function mockFetchOnce({ ok = true, status = 200, body = {} } = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok, status, text: () => Promise.resolve(text),
  });
}

describe("session", () => {
  it("salva e lê token e usuário", () => {
    session.set("tok123", { id: 1, nome: "Ana" });
    expect(session.getToken()).toBe("tok123");
    expect(session.getUser()).toEqual({ id: 1, nome: "Ana" });
  });

  it("set(null, usuario) atualiza só o usuário sem apagar o token", () => {
    session.set("tok", { id: 1 });
    session.set(null, { id: 1, nome: "Ana" });
    expect(session.getToken()).toBe("tok");
    expect(session.getUser().nome).toBe("Ana");
  });

  it("clear() remove tudo", () => {
    session.set("tok", { id: 1 });
    session.clear();
    expect(session.getToken()).toBeNull();
    expect(session.getUser()).toBeNull();
  });

  it("getUser() tolera JSON inválido", () => {
    localStorage.setItem("ceo_usuario", "{invalido");
    expect(session.getUser()).toBeNull();
  });
});

describe("api request", () => {
  beforeEach(() => { session.clear(); });

  it("GET retorna o corpo JSON", async () => {
    mockFetchOnce({ body: { ok: true, valor: 42 } });
    const data = await api.get("/x", { auth: false });
    expect(data).toEqual({ ok: true, valor: 42 });
  });

  it("anexa Authorization: Bearer quando há token", async () => {
    session.set("meu-token", { id: 1 });
    mockFetchOnce({ body: {} });
    await api.get("/protegido");
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Bearer meu-token");
  });

  it("não anexa Authorization quando auth:false", async () => {
    session.set("meu-token", { id: 1 });
    mockFetchOnce({ body: {} });
    await api.post("/login", { email: "a" }, { auth: false });
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("erro de negócio (4xx) usa a mensagem do campo {mensagem}", async () => {
    mockFetchOnce({ ok: false, status: 400, body: { mensagem: "Justificativa curta" } });
    await expect(api.post("/pedidos", {}, { auth: false }))
      .rejects.toMatchObject({ message: "Justificativa curta", status: 400 });
  });

  it("erro interno usa o campo {error}", async () => {
    mockFetchOnce({ ok: false, status: 500, body: { error: "boom" } });
    await expect(api.get("/x", { auth: false }))
      .rejects.toMatchObject({ message: "boom", status: 500 });
  });

  it("401 limpa a sessão", async () => {
    session.set("tok", { id: 1 });
    mockFetchOnce({ ok: false, status: 401, body: { mensagem: "expirado" } });
    await expect(api.get("/eu")).rejects.toBeInstanceOf(ApiError);
    expect(session.getToken()).toBeNull();
  });

  it("falha de rede vira ApiError de conexão (status 0)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("network"));
    await expect(api.get("/x", { auth: false }))
      .rejects.toMatchObject({ status: 0 });
  });

  it("envia o corpo serializado em JSON", async () => {
    mockFetchOnce({ body: {} });
    await api.post("/x", { a: 1 }, { auth: false });
    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.body).toBe(JSON.stringify({ a: 1 }));
  });
});
