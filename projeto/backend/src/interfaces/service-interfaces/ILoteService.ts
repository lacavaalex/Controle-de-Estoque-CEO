// interface de serviço de lote
import type { Lote } from "../../entities/Lote.js";

export interface ILoteService {
  addLote(
    product_id: number,
    sector_id: number,
    lot_number: string,
    expires_at: Date,
    quantity: number,
    manufactured_at?: Date,
  ): Promise<Lote>;
}
