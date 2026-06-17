import { describe, it, expect } from "vitest";
import {
  ehGestorGlobal,
  podeProcessarPedidos,
  podeVerSetor,
  podeEditarEstoque,
  podeCriarPedido,
  podeProvisionarUsuario,
  type Identidade,
} from "./rbac.js";

const HO = 1;
const CEO = 2;

const gestorHo: Identidade = { usuarioId: 1, perfil: "gestor", setorId: HO, setorTipo: "almoxarifado" };
const almoxarife: Identidade = { usuarioId: 2, perfil: "almoxarife", setorId: HO, setorTipo: "almoxarifado" };
const gestorCeo: Identidade = { usuarioId: 3, perfil: "gestor", setorId: CEO, setorTipo: "destinatario" };
const solicitanteCeo: Identidade = { usuarioId: 4, perfil: "solicitante", setorId: CEO, setorTipo: "destinatario" };

describe("ehGestorGlobal", () => {
  it("só gestor do almoxarifado (HO) é global", () => {
    expect(ehGestorGlobal(gestorHo)).toBe(true);
    expect(ehGestorGlobal(gestorCeo)).toBe(false);
    expect(ehGestorGlobal(almoxarife)).toBe(false);
  });
});

describe("podeProcessarPedidos (RN11)", () => {
  it("gestor HO e almoxarife sim; CEO não", () => {
    expect(podeProcessarPedidos(gestorHo)).toBe(true);
    expect(podeProcessarPedidos(almoxarife)).toBe(true);
    expect(podeProcessarPedidos(gestorCeo)).toBe(false);
    expect(podeProcessarPedidos(solicitanteCeo)).toBe(false);
  });
});

describe("podeVerSetor (RN12)", () => {
  it("HO vê todos os setores", () => {
    expect(podeVerSetor(gestorHo, CEO)).toBe(true);
    expect(podeVerSetor(almoxarife, CEO)).toBe(true);
  });
  it("CEO só vê o próprio setor", () => {
    expect(podeVerSetor(gestorCeo, CEO)).toBe(true);
    expect(podeVerSetor(gestorCeo, HO)).toBe(false);
    expect(podeVerSetor(solicitanteCeo, CEO)).toBe(true);
    expect(podeVerSetor(solicitanteCeo, HO)).toBe(false);
  });
});

describe("podeEditarEstoque (RN12)", () => {
  it("gestor HO edita qualquer setor", () => {
    expect(podeEditarEstoque(gestorHo, CEO)).toBe(true);
    expect(podeEditarEstoque(gestorHo, HO)).toBe(true);
  });
  it("gestor CEO edita só o CEO", () => {
    expect(podeEditarEstoque(gestorCeo, CEO)).toBe(true);
    expect(podeEditarEstoque(gestorCeo, HO)).toBe(false);
  });
  it("solicitante não edita (somente leitura)", () => {
    expect(podeEditarEstoque(solicitanteCeo, CEO)).toBe(false);
  });
});

describe("podeCriarPedido (RN09)", () => {
  it("solicitante e gestor criam para o próprio setor", () => {
    expect(podeCriarPedido(solicitanteCeo, CEO)).toBe(true);
    expect(podeCriarPedido(solicitanteCeo, HO)).toBe(false);
    expect(podeCriarPedido(gestorCeo, CEO)).toBe(true);
  });
  it("gestor HO pode escolher qualquer setor de origem", () => {
    expect(podeCriarPedido(gestorHo, CEO)).toBe(true);
  });
  it("almoxarife não cria pedido", () => {
    expect(podeCriarPedido(almoxarife, HO)).toBe(false);
  });
});

describe("podeProvisionarUsuario (US-EP01-06 / RN01)", () => {
  it("gestor HO cria qualquer perfil em qualquer setor", () => {
    expect(podeProvisionarUsuario(gestorHo, "almoxarife", HO)).toBe(true);
    expect(podeProvisionarUsuario(gestorHo, "solicitante", CEO)).toBe(true);
    expect(podeProvisionarUsuario(gestorHo, "gestor", CEO)).toBe(true);
  });
  it("gestor CEO só cria solicitante no próprio setor", () => {
    expect(podeProvisionarUsuario(gestorCeo, "solicitante", CEO)).toBe(true);
    expect(podeProvisionarUsuario(gestorCeo, "almoxarife", CEO)).toBe(false);
    expect(podeProvisionarUsuario(gestorCeo, "solicitante", HO)).toBe(false);
  });
  it("não-gestores não provisionam", () => {
    expect(podeProvisionarUsuario(almoxarife, "solicitante", HO)).toBe(false);
    expect(podeProvisionarUsuario(solicitanteCeo, "solicitante", CEO)).toBe(false);
  });
});
