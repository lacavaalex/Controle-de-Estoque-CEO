import type { Solicitacao } from "../../entities/Solicitacao.js";
import type { StatusSolicitacao } from "../../entities/enums.js";

export interface ISolicitacaoRepository {
  findAll(filters?: {
    status?: StatusSolicitacao;
    solicitante?: string;           // RN12: dentista vê apenas as próprias
  }): Promise<Solicitacao[]>;

  findById(id: string): Promise<Solicitacao | null>;

  create(
    sol: Omit<Solicitacao, "status" | "data_conclusao" | "responsavel" | "observacao">
  ): Promise<Solicitacao>;

  // RN10, INV02: pendente → aprovada
  aprovar(id: string, responsavel: string): Promise<Solicitacao | null>;

  // RN10, INV03, RN11: pendente → negada
  negar(id: string, responsavel: string, observacao: string): Promise<Solicitacao | null>;

  // RF05.11: gerador de ID sequencial SOL-NNN
  getNextId(): Promise<string>;
}
