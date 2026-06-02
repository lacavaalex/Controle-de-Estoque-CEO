import type { Movimentacao } from "../../entities/Movimentacao.js";

export interface IMovimentacaoRepository {
  findAll(): Promise<Movimentacao[]>;
  findRecent(limit?: number): Promise<Movimentacao[]>;  // RF06.4: log do dashboard
  findById(id: string): Promise<Movimentacao | null>;
  create(mov: Omit<Movimentacao, "data">): Promise<Movimentacao>;
  getNextId(): Promise<string>;                          // gerador MOV-NNN
}
