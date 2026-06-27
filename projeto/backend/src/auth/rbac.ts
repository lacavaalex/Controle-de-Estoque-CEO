// RBAC por perfil e setor (RN01, RN12). O almoxarifado (HO) é global; os
// setores destinatários (CEO etc.) ficam restritos ao próprio setor. As funções
// recebem a identidade do JWT: { perfil, setorId, setorTipo }.
import type { Perfil, TipoSetor } from "../entities/index.js";

export interface Identidade {
  usuarioId: number;
  perfil: Perfil;
  setorId: number;
  setorTipo: TipoSetor;
}

/** Gestor do almoxarifado (HO) = super-user global. */
export function ehGestorGlobal(id: Identidade): boolean {
  return id.perfil === "gestor" && id.setorTipo === "almoxarifado";
}

/** Pode processar pedidos / expedir (almoxarife ou gestor HO). RN11. */
export function podeProcessarPedidos(id: Identidade): boolean {
  return ehGestorGlobal(id) || (id.perfil === "almoxarife" && id.setorTipo === "almoxarifado");
}

/**
 * RN12 — pode VER os pedidos/estoque de um setor alvo?
 *  - Gestor HO e almoxarife (HO): todos os setores.
 *  - Demais (gestor CEO, solicitante): apenas o próprio setor.
 */
export function podeVerSetor(id: Identidade, setorAlvoId: number): boolean {
  if (podeProcessarPedidos(id)) return true;
  return id.setorId === setorAlvoId;
}

/**
 * RN12 — pode EDITAR estoque (consumo/ajuste) de um setor?
 *  - Gestor HO: qualquer setor.
 *  - Gestor CEO: só o CEO (próprio setor).
 *  - Almoxarife: o almoxarifado (próprio setor).
 *  - Solicitante: não edita (somente leitura).
 */
export function podeEditarEstoque(id: Identidade, setorAlvoId: number): boolean {
  if (ehGestorGlobal(id)) return true;
  if (id.perfil === "gestor" || id.perfil === "almoxarife") return id.setorId === setorAlvoId;
  return false;
}

/** Pode criar pedido? Solicitante e gestor (do próprio setor). */
export function podeCriarPedido(id: Identidade, setorOrigemId: number): boolean {
  if (ehGestorGlobal(id)) return true; // gestor HO pode escolher o setor
  if (id.perfil === "solicitante" || id.perfil === "gestor") return id.setorId === setorOrigemId;
  return false;
}

/**
 * Provisionamento de usuários (US-EP01-06 / RN01):
 *  - Gestor HO: cria QUALQUER perfil em QUALQUER setor.
 *  - Gestor CEO: cria apenas `solicitante` no PRÓPRIO setor (CEO).
 *  - Demais: não provisionam.
 */
export function podeProvisionarUsuario(
  autor: Identidade,
  novoPerfil: Perfil,
  novoSetorId: number,
): boolean {
  if (ehGestorGlobal(autor)) return true;
  if (autor.perfil === "gestor" && autor.setorTipo === "destinatario") {
    return novoPerfil === "solicitante" && novoSetorId === autor.setorId;
  }
  return false;
}
