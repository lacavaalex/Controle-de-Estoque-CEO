// Entidade EstoqueCeo — §2.3 do modelo conceitual
// Saldo do item no subdepartamento CEO. Separado fisicamente do estoque da Dispensação.
import type { CategoriaItem, UnidadeMedida } from "./enums.js";

export interface EstoqueCeo {
  id: number;                    // BIGSERIAL
  item_id: number;               // FK → item.id — INV04
  nome: string;                  // denormalizado §2.3
  categoria: CategoriaItem;      // denormalizado §2.3
  quantidade: number;            // INTEGER >= 0 — INV05
  unidade: UnidadeMedida;        // denormalizado §2.3
  estoque_minimo: number;        // INTEGER >= 0 — §2.3: mínimo próprio do CEO
}

// Status calculado em runtime pelo statusCalculator — RN07 (não persistido)
