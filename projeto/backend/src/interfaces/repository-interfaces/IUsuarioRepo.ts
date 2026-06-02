import type { Usuario } from "../../entities/Usuario.js";

export interface IUsuarioRepository {
  findById(id: number): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;   // RF01.1: login por e-mail
  findAll(): Promise<Usuario[]>;
  create(usuario: Omit<Usuario, "id">): Promise<Usuario>;
  update(id: number, data: Partial<Omit<Usuario, "id">>): Promise<Usuario | null>;
}
