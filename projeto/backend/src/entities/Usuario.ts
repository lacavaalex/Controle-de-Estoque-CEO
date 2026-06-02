// Entidade Usuario — §2.1 do modelo conceitual
import type { Role } from "./enums.js";

export interface Usuario {
  id: number;           // BIGSERIAL
  nome: string;         // VARCHAR(150)
  email: string;        // VARCHAR(150), UNIQUE, CHECK @ufpe.br — RF01.1, PR04
  senha_hash: string;   // VARCHAR(255) — RNF03.3
  cargo: string;        // VARCHAR(100)
  role: Role;           // role_usuario ENUM — RN01, INV06
  unidade: string;      // VARCHAR(120)
  avatar: string | null; // CHAR(2), opcional — §2.1
}

// Tipo público: omite senha_hash para respostas de API — RNF03.3
export type UsuarioPublico = Omit<Usuario, "senha_hash">;
