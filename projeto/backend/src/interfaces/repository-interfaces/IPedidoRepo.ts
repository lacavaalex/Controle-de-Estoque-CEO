import type {
  ItemDoPedido,
  NovoItemDoPedido,
  NovoPedido,
  Pedido,
  StatusPedido,
} from "../../entities/index.js";
import type { Tx } from "../../db/client.js";

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
  // `tx` opcional: opera na transação do chamador quando informado; senão abre
  // a própria.
  criar(
    cabecalho: NovoPedidoSemId,
    itens: NovoItemSemPedido[],
    tx?: Tx,
  ): Promise<PedidoComItens>;

  buscarPorId(id: string): Promise<PedidoComItens | null>;

  // Pedidos cujo setor de ORIGEM ou DESTINO é o informado (RN12 — escopo).
  listarPorSetor(setorId: number): Promise<PedidoComItens[]>;

  // CEO-251 — fila do almoxarife: pedidos com trabalho pendente (status
  // 'pendente' ou 'em_processamento'), de TODOS os setores, em ordem de
  // chegada (mais antigo primeiro — FIFO).
  listarPendentes(): Promise<PedidoComItens[]>;

  // Atualiza o status (derivado) do cabeçalho — chamado após (re)processar itens.
  atualizarStatus(id: string, status: StatusPedido): Promise<void>;

  // Busca todos os pedidos do sistema (Visão global para Almoxarife/HO)
  listarTodos(): Promise<PedidoComItens[]>;
}
