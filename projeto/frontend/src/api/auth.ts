// Chamadas de autenticação (EP01). Espelha AuthController/AuthService do backend.
import { api } from "./client";
import type { Identidade, Usuario } from "@/types/domain";

export interface ResultadoLogin {
  token: string;
  usuario: Usuario;
}

/** POST /login — público (sem Bearer). Devolve { token, usuario }. */
export function login(email: string, senha: string): Promise<ResultadoLogin> {
  return api.post<ResultadoLogin>("/login", { email, senha }, false);
}

/** GET /eu — identidade do usuário autenticado (a partir do token). */
export function eu(): Promise<{ identidade: Identidade }> {
  return api.get<{ identidade: Identidade }>("/eu");
}
