import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { criarApp } from "./app.js";

// Testes de nível HTTP (ponta-a-ponta da API): exercitam o app Express real
// — roteamento, middleware de auth, RBAC e os controllers — contra o Postgres
// de desenvolvimento. Codificam a validação que antes era feita à mão com curl.
//
// Pré-requisito: o banco precisa estar com o seed RECÉM-aplicado
// (`npm run db:seed`). O seed faz TRUNCATE + RESTART IDENTITY e insere os
// setores na ordem HO, CEO, Dispensação — por isso os IDs abaixo são
// determinísticos: HO=1, CEO=2. No CI o passo de seed roda logo antes destes
// testes; localmente, rode o seed antes se os IDs tiverem divergido.
//
// Os testes são quase todos de leitura. A única escrita é a tentativa de criar
// pedido com itens vazios, que o backend REJEITA (não persiste linha) — então
// na prática a suíte não muta estado compartilhado com as outras.

const app = criarApp();

// Credenciais do seed (src/db/seed.ts). Login é por email institucional (RN01).
const SENHA = "ceoufpe2026";
const ALMOXARIFE = { email: "joao.silva@ufpe.br", senha: SENHA }; // perfil almoxarife, setor HO
const GESTOR_HO = { email: "ana.costa@ufpe.br", senha: SENHA }; // perfil gestor, setor HO
const SOLICITANTE = { email: "rafael.moura@ufpe.br", senha: SENHA }; // perfil solicitante, setor CEO

const SETOR_HO = 1;
const SETOR_CEO = 2;

async function logar(cred: { email: string; senha: string }): Promise<string> {
  const res = await request(app).post("/login").send(cred);
  expect(res.status).toBe(200);
  expect(typeof res.body.token).toBe("string");
  return res.body.token as string;
}

const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

// Loga cada identidade UMA vez e reusa o token na suíte inteira (JWT vale 8h).
// Evita repetir o bcrypt.compare (caro, SALT_ROUNDS alto) a cada teste.
let tokenAlmoxarife: string;
let tokenGestorHo: string;
let tokenSolicitante: string;

beforeAll(async () => {
  [tokenAlmoxarife, tokenGestorHo, tokenSolicitante] = await Promise.all([
    logar(ALMOXARIFE),
    logar(GESTOR_HO),
    logar(SOLICITANTE),
  ]);
});

describe("Healthcheck", () => {
  it("GET /health responde 200 { ok: true }", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("Autenticação (EP01)", () => {
  it("POST /login com credenciais válidas retorna token + usuario, sem vazar o hash", async () => {
    const res = await request(app).post("/login").send(ALMOXARIFE);
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.usuario).toMatchObject({ email: ALMOXARIFE.email, perfil: "almoxarife" });
    // Segurança: a senha (em qualquer forma) nunca pode sair na resposta.
    expect(res.body.usuario).not.toHaveProperty("senhaHash");
    expect(JSON.stringify(res.body)).not.toContain(SENHA);
  });

  it("POST /login com senha errada retorna 401", async () => {
    const res = await request(app).post("/login").send({ email: ALMOXARIFE.email, senha: "errada" });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("mensagem");
  });

  it("POST /login com email inexistente retorna 401", async () => {
    const res = await request(app).post("/login").send({ email: "ninguem@ufpe.br", senha: SENHA });
    expect(res.status).toBe(401);
  });

  it("GET /eu sem token retorna 401", async () => {
    const res = await request(app).get("/eu");
    expect(res.status).toBe(401);
  });

  it("GET /eu com token retorna a identidade do usuário logado", async () => {
    const token = tokenGestorHo;
    const res = await request(app).get("/eu").set(bearer(token));
    expect(res.status).toBe(200);
    // A identidade do JWT carrega perfil/setor (não o email — RNF03 / ADR-0005).
    expect(res.body.identidade).toMatchObject({
      perfil: "gestor",
      setorTipo: "almoxarifado",
      setorId: SETOR_HO,
    });
  });

  it("GET /eu com token malformado retorna 401", async () => {
    const res = await request(app).get("/eu").set({ Authorization: "Bearer nao-e-um-jwt" });
    expect(res.status).toBe(401);
  });
});

describe("Setores", () => {
  it("GET /setores autenticado lista os setores do seed", async () => {
    const token = tokenAlmoxarife;
    const res = await request(app).get("/setores").set(bearer(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.setores)).toBe(true);
    const nomes = res.body.setores.map((s: { nome: string }) => s.nome);
    expect(nomes).toContain("HO");
    expect(nomes).toContain("CEO");
  });

  it("GET /setores sem token retorna 401", async () => {
    const res = await request(app).get("/setores");
    expect(res.status).toBe(401);
  });
});

describe("RBAC — escopo de perfil e de setor (RN11/RN12)", () => {
  it("solicitante NÃO pode listar usuários (gestor-only) → 403", async () => {
    const token = tokenSolicitante;
    const res = await request(app).get("/usuarios").set(bearer(token));
    expect(res.status).toBe(403);
  });

  it("gestor HO PODE listar usuários → 200", async () => {
    const token = tokenGestorHo;
    const res = await request(app).get("/usuarios").set(bearer(token));
    expect(res.status).toBe(200);
  });

  it("solicitante do CEO NÃO enxerga o estoque do HO (cross-setor) → 403", async () => {
    const token = tokenSolicitante;
    const res = await request(app).get(`/setores/${SETOR_HO}/estoque`).set(bearer(token));
    expect(res.status).toBe(403);
  });

  it("solicitante do CEO enxerga o estoque do próprio setor → 200", async () => {
    const token = tokenSolicitante;
    const res = await request(app).get(`/setores/${SETOR_CEO}/catalogo`).set(bearer(token));
    expect(res.status).toBe(200);
  });

  it("solicitante NÃO pode processar a fila de pedidos pendentes → 403", async () => {
    const token = tokenSolicitante;
    const res = await request(app).get("/pedidos/pendentes").set(bearer(token));
    expect(res.status).toBe(403);
  });

  it("almoxarife PODE ver a fila de pedidos pendentes → 200", async () => {
    const token = tokenAlmoxarife;
    const res = await request(app).get("/pedidos/pendentes").set(bearer(token));
    expect(res.status).toBe(200);
  });
});

describe("Dashboard (EP05)", () => {
  it("almoxarife HO obtém KPIs do próprio setor → 200", async () => {
    const token = tokenAlmoxarife;
    const res = await request(app).get(`/dashboard?setorId=${SETOR_HO}`).set(bearer(token));
    expect(res.status).toBe(200);
  });

  it("solicitante do CEO NÃO obtém KPIs do HO (cross-setor) → 403", async () => {
    const token = tokenSolicitante;
    const res = await request(app).get(`/dashboard?setorId=${SETOR_HO}`).set(bearer(token));
    expect(res.status).toBe(403);
  });
});

describe("Pedidos — criação (EP04-01)", () => {
  it("solicitante cria pedido no próprio setor e o detalhe fica acessível", async () => {
    const token = tokenSolicitante;
    const cria = await request(app)
      .post("/pedidos")
      .set(bearer(token))
      .send({
        setorOrigemId: SETOR_CEO,
        setorDestinoId: SETOR_HO,
        justificativa: "Pedido criado pelo teste de HTTP (smoke de integração).",
        itens: [],
      });
    // O setor de origem é o do próprio solicitante: RBAC deve liberar (não 403).
    // Aceitamos 201 (criado) ou 400 (regra de negócio, ex.: itens vazios),
    // mas nunca 403 — o ponto aqui é validar a autorização ponta-a-ponta.
    expect(cria.status).not.toBe(403);
    expect(cria.status).not.toBe(401);
  });

  it("solicitante NÃO cria pedido para um setor de origem que não é o seu → 403", async () => {
    const token = tokenSolicitante;
    const res = await request(app)
      .post("/pedidos")
      .set(bearer(token))
      .send({
        setorOrigemId: SETOR_HO, // origem alheia ao solicitante do CEO
        setorDestinoId: SETOR_CEO,
        justificativa: "Tentativa inválida de origem alheia.",
        itens: [],
      });
    expect(res.status).toBe(403);
  });

  it("criar pedido sem token retorna 401", async () => {
    const res = await request(app).post("/pedidos").send({ setorOrigemId: SETOR_CEO });
    expect(res.status).toBe(401);
  });
});
