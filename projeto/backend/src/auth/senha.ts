// Hash e verificação de senha com bcrypt (RNF03.3) — nunca texto puro.
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function gerarHashSenha(senhaPura: string): Promise<string> {
  if (typeof senhaPura !== "string" || senhaPura.length < 8) {
    throw new Error("Senha deve ter ao menos 8 caracteres");
  }
  return bcrypt.hash(senhaPura, SALT_ROUNDS);
}

export async function verificarSenha(senhaPura: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senhaPura, hash);
}
