import { describe, it, expect, beforeAll } from "vitest";
import { gerarHashSenha, verificarSenha } from "./senha.js";

describe("senha (bcrypt)", () => {
  it("gera hash diferente da senha e verifica corretamente", async () => {
    const hash = await gerarHashSenha("senhaForte123");
    expect(hash).not.toBe("senhaForte123");
    expect(await verificarSenha("senhaForte123", hash)).toBe(true);
    expect(await verificarSenha("senhaErrada", hash)).toBe(false);
  });

  it("rejeita senha curta", async () => {
    await expect(gerarHashSenha("1234")).rejects.toThrow("ao menos 8");
  });
});

describe("jwt (round-trip)", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "segredo-de-teste";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  it("assina e verifica preservando perfil e setor", async () => {
    // Import dinâmico para garantir que o env já está setado.
    const { assinarToken, verificarToken } = await import("./jwt.js");
    const token = assinarToken({ sub: 42, email: "x@ufpe.br", perfil: "almoxarife", setorId: 1 });
    const payload = verificarToken(token);
    expect(payload.sub).toBe(42);
    expect(payload.email).toBe("x@ufpe.br");
    expect(payload.perfil).toBe("almoxarife");
    expect(payload.setorId).toBe(1);
  });

  it("rejeita token adulterado", async () => {
    const { verificarToken } = await import("./jwt.js");
    expect(() => verificarToken("token.invalido.aqui")).toThrow();
  });
});
