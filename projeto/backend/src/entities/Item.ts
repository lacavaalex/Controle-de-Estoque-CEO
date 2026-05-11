import type { CategoriaItem, UnidadeMedida } from "./enums.js";

export interface Item {
  id: number;
  nome: string;
  categoria: CategoriaItem;
  lote: string;
  quantidade: number;
  unidade: UnidadeMedida;
  estoque_minimo: number;
  estoque_maximo: number;
  validade: string;
  localizacao: string | null;
  fornecedor: string | null;
}
