// Chamadas de pedido (EP04). Espelha PedidoController/routes do backend.
import { api } from "./client";
import type { NovoPedido, PedidoComItens } from "@/types/domain";

/**
 * POST /pedidos — cria um pedido multi-item. O backend deriva solicitanteId da
 * identidade; enviamos setorOrigem/destino, justificativa (>=10 chars, RN09) e
 * os itens (cada um com produtoId OU descricaoLivre — XOR/INV07). Devolve o
 * pedido criado já com seus itens.
 */
export async function criarPedido(dados: NovoPedido): Promise<PedidoComItens> {
  const { pedido } = await api.post<{ pedido: PedidoComItens }>("/pedidos", dados);
  return pedido;
}

/** GET /setores/:setorId/pedidos — pedidos cujo setor (origem OU destino) é o dado. */
export async function pedidosDoSetor(setorId: number): Promise<PedidoComItens[]> {
  const { pedidos } = await api.get<{ pedidos: PedidoComItens[] }>(
    `/setores/${setorId}/pedidos`,
  );
  return pedidos;
}

/** GET /pedidos/:id — detalha um pedido com seus itens. */
export async function detalharPedido(id: string): Promise<PedidoComItens> {
  const { pedido } = await api.get<{ pedido: PedidoComItens }>(`/pedidos/${id}`);
  return pedido;
}
