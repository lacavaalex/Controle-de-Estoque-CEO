// Chamadas de estoque (EP02). Espelha EstoqueService/routes do backend.
import { api } from "./client";
import type { Categoria, ProdutoComEstoque, StatusProduto } from "@/types/domain";

// Filtros aceitos por GET /setores/:setorId/estoque (US-EP02-03).
// Espelha FiltrosCatalogo do backend (EstoqueService.ts).
export interface FiltrosEstoque {
  texto?: string;
  categoria?: Categoria;
  status?: StatusProduto;
  somenteComEstoque?: boolean;
  somenteSemEstoque?: boolean;
}

function montarQuery(filtros: FiltrosEstoque): string {
  const params = new URLSearchParams();
  if (filtros.texto) params.set("texto", filtros.texto);
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.somenteComEstoque) params.set("somenteComEstoque", "true");
  if (filtros.somenteSemEstoque) params.set("somenteSemEstoque", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * GET /setores/:setorId/estoque — estoque agregado do setor (qtd_total + status
 * por produto). O RBAC do backend exige podeVerSetor: passe o setorId da própria
 * identidade do usuário logado. Devolve { estoque: ProdutoComEstoque[] }.
 */
export async function estoqueDoSetor(
  setorId: number,
  filtros: FiltrosEstoque = {},
): Promise<ProdutoComEstoque[]> {
  const { estoque } = await api.get<{ estoque: ProdutoComEstoque[] }>(
    `/setores/${setorId}/estoque${montarQuery(filtros)}`,
  );
  return estoque;
}
