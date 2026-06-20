import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { autenticarServico } from "./middleware.js";

// Stub mínimo de Response que captura status + corpo, no estilo dos handlers.
function fakeRes() {
  const r: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      r.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      r.body = payload;
      return res;
    },
  } as unknown as Response;
  return { res, captured: r };
}

function reqComAuth(header?: string): Request {
  return { headers: header ? { authorization: header } : {} } as Request;
}

const TOKEN_ORIGINAL = process.env.AGENTE_TOKEN;

afterEach(() => {
  if (TOKEN_ORIGINAL === undefined) delete process.env.AGENTE_TOKEN;
  else process.env.AGENTE_TOKEN = TOKEN_ORIGINAL;
});

describe("autenticarServico (EP08 — auth de serviço do agente)", () => {
  beforeEach(() => {
    process.env.AGENTE_TOKEN = "segredo-de-servico";
  });

  it("deixa passar com o Bearer correto", () => {
    const mw = autenticarServico();
    const { res, captured } = fakeRes();
    let chamouNext = false;
    mw(reqComAuth("Bearer segredo-de-servico"), res, () => {
      chamouNext = true;
    });
    expect(chamouNext).toBe(true);
    expect(captured.statusCode).toBeUndefined(); // não respondeu erro
  });

  it("401 quando o token não bate", () => {
    const mw = autenticarServico();
    const { res, captured } = fakeRes();
    let chamouNext = false;
    mw(reqComAuth("Bearer token-errado"), res, () => {
      chamouNext = true;
    });
    expect(chamouNext).toBe(false);
    expect(captured.statusCode).toBe(401);
  });

  it("401 quando falta o header Authorization", () => {
    const mw = autenticarServico();
    const { res, captured } = fakeRes();
    mw(reqComAuth(undefined), res, () => {});
    expect(captured.statusCode).toBe(401);
  });

  it("falha fechada: 503 quando AGENTE_TOKEN não está configurado", () => {
    delete process.env.AGENTE_TOKEN;
    const mw = autenticarServico();
    const { res, captured } = fakeRes();
    let chamouNext = false;
    // Mesmo mandando um Bearer qualquer, sem segredo no servidor não autentica.
    mw(reqComAuth("Bearer qualquer-coisa"), res, () => {
      chamouNext = true;
    });
    expect(chamouNext).toBe(false);
    expect(captured.statusCode).toBe(503);
  });
});
