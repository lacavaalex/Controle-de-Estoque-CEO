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

/** Expiração: número (segundos) ou string de duração (ex.: "8h", "30m"). */
function expiracao(): number | `${number}${"s" | "m" | "h" | "d"}` {
  const raw = process.env.JWT_EXPIRES_IN ?? "8h";
  if (/^\d+$/.test(raw)) return Number(raw); // segundos
  if (/^\d+[smhd]$/.test(raw)) return raw as `${number}${"s" | "m" | "h" | "d"}`;
  throw new Error(
    `JWT_EXPIRES_IN inválido ("${raw}"): use segundos (ex.: "3600") ou duração (ex.: "8h", "30m").`,
  );
}

/**
 * Valida a configuração de JWT no boot (fail-fast): segredo presente e
 * expiração bem-formada. Chamado por server.ts antes de aceitar requests.
 */
export function validarConfigJwt(): void {
  segredo();
  expiracao();
}

export function assinarToken(payload: PayloadToken): string {
  return jwt.sign(payload, segredo(), { expiresIn: expiracao() });
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
