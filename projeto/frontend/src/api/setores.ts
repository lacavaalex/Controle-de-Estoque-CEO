// Chamadas de setor. GET /setores lista todos os setores (HO/CEO...), usado para
// escolher origem/destino ao criar um pedido (EP04).
import { api } from "./client";
import type { Setor } from "@/types/domain";

export async function listarSetores(): Promise<Setor[]> {
  const { setores } = await api.get<{ setores: Setor[] }>("/setores");
  return setores;
}
