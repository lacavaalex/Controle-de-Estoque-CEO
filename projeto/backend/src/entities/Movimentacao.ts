// Entidade Movimentacao — §2.5 do modelo conceitual
// Registro auditável de toda alteração física do estoque — RNF07.1.
import type { TipoMovimentacao, UnidadeMedida, LocalEstoque } from "./enums.js";

export interface Movimentacao {
  id: string;              // VARCHAR(10), formato MOV-NNN — §2.5
  tipo: TipoMovimentacao;  // tipo_movimentacao ENUM
  item_id: number;         // FK → item.id — INV01
  item_nome: string;       // denormalizado §2.5: preserva nome histórico
  quantidade: number;      // pode ser negativo em ajuste — PR06
  unidade: UnidadeMedida;
  origem: string;          // string livre: "Fornecedor X", "Dispensação", "CEO" — §2.5
  destino: LocalEstoque;   // local_estoque ENUM — §2.5
  responsavel: string;     // quem executou — RNF07.1
  data: string;            // TIMESTAMPTZ — K1 KPI, RF06.4
  solicitacao_id: string | null; // FK → solicitacao.id (saídas vinculadas) — §2.5
}
