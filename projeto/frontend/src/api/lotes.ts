// Chamadas de lote (EP02). Espelha LoteController/routes do backend.
import { api } from "./client";
import type { LoteComEstado } from "@/types/domain";

/**
 * GET /produtos/:produtoId/lotes?setorId=... — lotes de um produto num setor,
 * já com `estadoValidade` (RN05). Por padrão o backend só devolve lotes ATIVOS;
 * `incluirInativos` traz também vencidos/segregados.
 *
 * RBAC: solicitante NÃO vê lote (RN12); demais conforme escopo de setor
 * (podeVerSetor). Passe o setorId do setor cujo estoque está sendo visto.
 */
export async function lotesDoProduto(
  produtoId: number,
  setorId: number,
  incluirInativos = false,
): Promise<LoteComEstado[]> {
  const params = new URLSearchParams({ setorId: String(setorId) });
  if (incluirInativos) params.set("incluirInativos", "true");
  const { lotes } = await api.get<{ lotes: LoteComEstado[] }>(
    `/produtos/${produtoId}/lotes?${params.toString()}`,
  );
  return lotes;
}
