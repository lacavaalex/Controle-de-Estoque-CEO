import type { Setor, NovoSetor } from "../../entities/index.js";

export interface ISetorRepository {
  criar(setor: NovoSetor): Promise<Setor>;
  listar(): Promise<Setor[]>;
  buscarPorId(id: number): Promise<Setor | null>;
}
