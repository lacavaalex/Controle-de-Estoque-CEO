import { eq, or, sql } from "drizzle-orm";
import type {
  IPedidoRepository,
  NovoItemSemPedido,
  NovoPedidoSemId,
  PedidoComItens,
} from "../interfaces/repository-interfaces/IPedidoRepo.js";
import type { StatusPedido } from "../entities/index.js";
import { db as defaultDb, type DB } from "../db/client.js";
import { itemDoPedido, pedido } from "../db/schema.js";

// Executor de transação (callback de db.transaction): compartilha a API de
// consulta com DB, mas não é o NodePgDatabase completo.
type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

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

  async criar(
    cabecalho: NovoPedidoSemId,
    itens: NovoItemSemPedido[],
  ): Promise<PedidoComItens> {
    if (itens.length === 0) throw new Error("Pedido deve ter ao menos um item (RN09)");

    return this.db.transaction(async (tx) => {
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
    });
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

    return { ...cabecalho, itens };
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
      resultado.push({ ...c, itens });
    }
    return resultado;
  }

  async atualizarStatus(id: string, status: StatusPedido): Promise<void> {
    await this.db.update(pedido).set({ status }).where(eq(pedido.id, id));
  }
}
