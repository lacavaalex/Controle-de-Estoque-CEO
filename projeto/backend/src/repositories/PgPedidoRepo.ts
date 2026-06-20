import { eq, or, sql } from "drizzle-orm";
import type {
  IPedidoRepository,
  ItemComDesdobramentos,
  NovoItemSemPedido,
  NovoPedidoSemId,
  PedidoComItens,
} from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { ItemDoPedido, StatusPedido } from "../entities/index.js";
import { db as defaultDb, type DB, type Tx } from "../db/client.js";
import { itemDoPedido, pedido } from "../db/schema.js";

// Aninha os itens-filho (itemPaiId != null — RF05.17) sob seus itens-pai.
// O array resultante contém apenas os itens RAIZ; cada um leva `desdobramentos`.
// Exportado para teste (pura).
export function aninharItens(linhas: ItemDoPedido[]): ItemComDesdobramentos[] {
  const raizes: ItemComDesdobramentos[] = [];
  const filhosPorPai = new Map<number, ItemDoPedido[]>();
  for (const linha of linhas) {
    if (linha.itemPaiId === null) {
      raizes.push(linha);
    } else {
      const lista = filhosPorPai.get(linha.itemPaiId) ?? [];
      lista.push(linha);
      filhosPorPai.set(linha.itemPaiId, lista);
    }
  }
  for (const raiz of raizes) {
    const filhos = filhosPorPai.get(raiz.id);
    if (filhos && filhos.length > 0) raiz.desdobramentos = filhos;
  }
  return raizes;
}

export class PgPedidoRepo implements IPedidoRepository {
  constructor(private db: DB = defaultDb) {}

  // Próximo id formatado PED-NNN a partir da sequência (lpad 3 dígitos).
  private async proximoId(executor: Tx | DB): Promise<string> {
    const r = await executor.execute<{ id: string }>(
      sql`SELECT 'PED-' || lpad(nextval('seq_pedido')::text, 3, '0') AS id`,
    );
    const row = r.rows[0];
    if (!row) throw new Error("Falha ao gerar id do pedido");
    return row.id;
  }

  /**
   * Cria pedido (gera PED-NNN) + itens atomicamente. Aceita um `tx` externo
   * (ex.: a promoção rascunho→pedido, que precisa criar o pedido E marcar o
   * rascunho na MESMA transação). Sem `tx`, abre a própria — comportamento
   * standalone preservado.
   */
  async criar(
    cabecalho: NovoPedidoSemId,
    itens: NovoItemSemPedido[],
    tx?: Tx,
  ): Promise<PedidoComItens> {
    if (itens.length === 0) throw new Error("Pedido deve ter ao menos um item (RN09)");

    if (tx) return this.criarNaTransacao(tx, cabecalho, itens);
    return this.db.transaction((novaTx) => this.criarNaTransacao(novaTx, cabecalho, itens));
  }

  // Corpo da criação sobre um executor transacional (próprio ou emprestado).
  private async criarNaTransacao(
    tx: Tx,
    cabecalho: NovoPedidoSemId,
    itens: NovoItemSemPedido[],
  ): Promise<PedidoComItens> {
    const id = await this.proximoId(tx);

    const [cabecalhoCriado] = await tx
      .insert(pedido)
      .values({ ...cabecalho, id })
      .returning();
    if (!cabecalhoCriado) throw new Error("Falha ao criar pedido");

    const itensCriados = await tx
      .insert(itemDoPedido)
      .values(itens.map((i) => ({ ...i, pedidoId: id })))
      .returning();

    return { ...cabecalhoCriado, itens: itensCriados };
  }

  async buscarPorId(id: string): Promise<PedidoComItens | null> {
    const [cabecalho] = await this.db
      .select()
      .from(pedido)
      .where(eq(pedido.id, id))
      .limit(1);
    if (!cabecalho) return null;

    const itens = await this.db
      .select()
      .from(itemDoPedido)
      .where(eq(itemDoPedido.pedidoId, id));

    return { ...cabecalho, itens: aninharItens(itens) };
  }

  async listarPorSetor(setorId: number): Promise<PedidoComItens[]> {
    const cabecalhos = await this.db
      .select()
      .from(pedido)
      .where(
        or(eq(pedido.setorOrigemId, setorId), eq(pedido.setorDestinoId, setorId)),
      );

    // N+1 simples (volume de pedidos é baixo no MVP); otimizar com IN se preciso.
    const resultado: PedidoComItens[] = [];
    for (const c of cabecalhos) {
      const itens = await this.db
        .select()
        .from(itemDoPedido)
        .where(eq(itemDoPedido.pedidoId, c.id));
      resultado.push({ ...c, itens: aninharItens(itens) });
    }
    return resultado;
  }

  async atualizarStatus(id: string, status: StatusPedido): Promise<void> {
    await this.db.update(pedido).set({ status }).where(eq(pedido.id, id));
  }
}
