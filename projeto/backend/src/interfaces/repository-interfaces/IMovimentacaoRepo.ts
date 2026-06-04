import type { Movimentacao, NovaMovimentacao } from "../../entities/index.js";

// `id` (MOV-NNN) é gerado pelo repositório a partir da sequência; por isso o
// payload de criação omite o id.
export type NovaMovimentacaoSemId = Omit<NovaMovimentacao, "id">;

export interface IMovimentacaoRepository {
  // Cria uma movimentação, gerando o id MOV-NNN.
  registrar(mov: NovaMovimentacaoSemId): Promise<Movimentacao>;
  buscarPorId(id: string): Promise<Movimentacao | null>;
  listarPorLote(loteId: number): Promise<Movimentacao[]>;
  listarPorSetor(setorId: number): Promise<Movimentacao[]>;
}
