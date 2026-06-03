import type {
  ItemDoPedido,
  NovoItemDoPedido,
  NovoPedido,
  Pedido,
  StatusPedido,
} from "../../entities/index.js";

// `id` (PED-NNN) é gerado pelo repositório a partir da sequência; o payload de
// criação do cabeçalho omite o id e o status (derivado — nasce 'pendente').
export type NovoPedidoSemId = Omit<NovoPedido, "id" | "status">;

// Item na criação: sem id e sem pedidoId (o repo amarra ao pedido criado).
export type NovoItemSemPedido = Omit<NovoItemDoPedido, "id" | "pedidoId">;

// Leitura do agregado completo (cabeçalho + linhas).
export interface PedidoComItens extends Pedido {
  itens: ItemDoPedido[];
}

export interface IPedidoRepository {
  // Cria o pedido (gera PED-NNN) e seus itens, atomicamente. Retorna o agregado.
  criar(cabecalho: NovoPedidoSemId, itens: NovoItemSemPedido[]): Promise<PedidoComItens>;

  buscarPorId(id: string): Promise<PedidoComItens | null>;

  // Pedidos cujo setor de ORIGEM ou DESTINO é o informado (RN12 — escopo).
  listarPorSetor(setorId: number): Promise<PedidoComItens[]>;

  // Atualiza o status (derivado) do cabeçalho — chamado após (re)processar itens.
  atualizarStatus(id: string, status: StatusPedido): Promise<void>;
}
