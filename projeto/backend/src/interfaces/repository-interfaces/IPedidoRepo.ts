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

// Item na leitura: pode trazer os desdobramentos por lote (filhos — RF05.17).
export interface ItemComDesdobramentos extends ItemDoPedido {
  desdobramentos?: ItemDoPedido[];
}

// Leitura do agregado completo (cabeçalho + linhas). `itens` traz apenas os
// itens RAIZ (itemPaiId IS NULL); cada um pode ter `desdobramentos` aninhados.
export interface PedidoComItens extends Pedido {
  itens: ItemComDesdobramentos[];
}

export interface IPedidoRepository {
  // Cria o pedido (gera PED-NNN) e seus itens, atomicamente. Retorna o agregado.
  criar(cabecalho: NovoPedidoSemId, itens: NovoItemSemPedido[]): Promise<PedidoComItens>;

  buscarPorId(id: string): Promise<PedidoComItens | null>;

  // Pedidos cujo setor de ORIGEM ou DESTINO é o informado (RN12 — escopo).
  listarPorSetor(setorId: number): Promise<PedidoComItens[]>;

  // Atualiza o status (derivado) do cabeçalho — chamado após (re)processar itens.
  atualizarStatus(id: string, status: StatusPedido): Promise<void>;

  // Busca todos os pedidos do sistema (Visão global para Almoxarife/HO)
  listarTodos(): Promise<PedidoComItens[]>;
}
