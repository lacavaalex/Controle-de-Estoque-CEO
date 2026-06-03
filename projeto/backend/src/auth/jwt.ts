// =============================================================================
// JWT stateless (ADR-0005). O token carrega perfil + setor para o middleware
// de RBAC verificar perfil×setor (RN01, RN12) sem ir ao banco a cada request.
// Segredo e expiração vêm do .env (ADR-0003).
// =============================================================================
import jwt from "jsonwebtoken";
import type { Perfil } from "../entities/index.js";

export interface PayloadToken {
  sub: number; // usuario.id
  email: string;
  perfil: Perfil;
  setorId: number;
}

function segredo(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET não definida (veja .env.example / ADR-0003).");
  return s;
}

export function assinarToken(payload: PayloadToken): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "8h";
  return jwt.sign(payload, segredo(), { expiresIn } as jwt.SignOptions);
}

export function verificarToken(token: string): PayloadToken {
  const decoded = jwt.verify(token, segredo());
  if (typeof decoded === "string") {
    throw new Error("Token inválido");
  }
  const { sub, email, perfil, setorId } = decoded as jwt.JwtPayload & Partial<PayloadToken>;
  if (
    typeof sub !== "number" ||
    typeof email !== "string" ||
    typeof perfil !== "string" ||
    typeof setorId !== "number"
  ) {
    throw new Error("Token com payload inválido");
  }
  return { sub, email, perfil: perfil as Perfil, setorId };
}
