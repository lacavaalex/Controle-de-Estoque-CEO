// Entidade lote
import type { EstadoLote } from "./enums.js";

// atributos condizentes com a tabela de lotes do banco de dados 
export interface Lote {
  id: number;
  product_id: number;
  sector_id: number;
  lot_number: string;
  manufactured_at: Date | null;
  expires_at: Date;
  quantity: number;
  status: EstadoLote;
  segregated_at: Date | null;
  segregation_note: string | null;
  updated_at: Date;
}