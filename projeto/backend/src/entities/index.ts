// =============================================================================
// Entidades de domínio v2 — CEO-UFPE
// Os tipos são inferidos do schema Drizzle (src/db/schema.ts) para manter
// entidades e banco como uma fonte única da verdade (ver ADR-0004). Os Json*/
// in-memory de teste e os Pg* implementam interfaces sobre estes tipos.
//
// Substitui o stub v1 `Item` (mantido em entities/Item.ts apenas enquanto o
// ItemService/rotas legados não forem migrados).
// =============================================================================
import type {
  setor,
  usuario,
  produto,
  lote,
  pedido,
  itemDoPedido,
  movimentacao,
} from "../db/schema.js";

// Linhas como vêm do banco (SELECT).
export type Setor = typeof setor.$inferSelect;
export type Usuario = typeof usuario.$inferSelect;
export type Produto = typeof produto.$inferSelect;
export type Lote = typeof lote.$inferSelect;
export type Pedido = typeof pedido.$inferSelect;
export type ItemDoPedido = typeof itemDoPedido.$inferSelect;
export type Movimentacao = typeof movimentacao.$inferSelect;

// Payloads de inserção (INSERT) — colunas com default/serial ficam opcionais.
export type NovoSetor = typeof setor.$inferInsert;
export type NovoUsuario = typeof usuario.$inferInsert;
export type NovoProduto = typeof produto.$inferInsert;
export type NovoLote = typeof lote.$inferInsert;
export type NovoPedido = typeof pedido.$inferInsert;
export type NovoItemDoPedido = typeof itemDoPedido.$inferInsert;
export type NovaMovimentacao = typeof movimentacao.$inferInsert;

// Enums de domínio como tipos (derivados das colunas).
export type TipoSetor = Setor["tipo"];
export type Perfil = Usuario["perfil"];
export type Categoria = Produto["categoria"];
export type Unidade = Produto["unidade"];
export type EstadoLote = Lote["estado"];
export type StatusItem = ItemDoPedido["statusItem"];
export type StatusPedido = Pedido["status"];
export type MotivoDivergencia = NonNullable<ItemDoPedido["motivoDivergencia"]>;
export type TipoMovimentacao = Movimentacao["tipo"];
