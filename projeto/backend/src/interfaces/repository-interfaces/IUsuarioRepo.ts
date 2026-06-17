import type { Usuario, NovoUsuario } from "../../entities/index.js";

export interface IUsuarioRepository {
  criar(usuario: NovoUsuario): Promise<Usuario>;
  listar(): Promise<Usuario[]>;
  buscarPorId(id: number): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  atualizar(id: number, props: Partial<Omit<Usuario, "id">>): Promise<void>;
}
