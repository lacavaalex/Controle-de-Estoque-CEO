// Entidade Solicitacao — §2.4 do modelo conceitual
// Pedido formal de material de um Dentista CEO ao Almoxarife.
import type { UnidadeMedida, StatusSolicitacao } from "./enums.js";

export interface Solicitacao {
  id: string;                        // VARCHAR(10), formato SOL-NNN — RF05.11
  item_id: number;                   // FK → item.id
  item_nome: string;                 // denormalizado §2.4
  solicitante: string;               // nome do dentista — §2.4 (TODO fase 2: FK → usuario.id)
  cargo: string;                     // denormalizado §2.4
  data_solicitacao: string;          // TIMESTAMPTZ — K1 KPI
  quantidade_solicitada: number;     // INTEGER >= 1 — RN09
  unidade: UnidadeMedida;
  justificativa: string;             // TEXT, trim >= 10 chars — RN09
  status: StatusSolicitacao;         // status_solicitacao ENUM — RN10
  data_conclusao: string | null;     // TIMESTAMPTZ, NOT NULL quando aprovada/negada — INV02, INV03
  responsavel: string | null;        // nome do almoxarife — RN11; NOT NULL quando aprovada/negada
  observacao: string | null;         // §2.4: especialmente relevante em negações
}
