// RBAC do lado do cliente — espelha auth/rbac.ts do backend. Serve só para
// MOSTRAR/ESCONDER ações na UI; a autorização real é sempre revalidada no
// backend (o guarda exigir(podeProcessarPedidos) protege a rota /expedir).
import type { Identidade } from "@/types/domain";

/** Gestor do almoxarifado (HO) = super-user global. */
export function ehGestorGlobal(id: Identidade): boolean {
  return id.perfil === "gestor" && id.setorTipo === "almoxarifado";
}

/** Pode processar pedidos / expedir (almoxarife ou gestor HO). RN11. */
export function podeProcessarPedidos(id: Identidade): boolean {
  return ehGestorGlobal(id) || (id.perfil === "almoxarife" && id.setorTipo === "almoxarifado");
}
