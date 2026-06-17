// =============================================================================
// Middlewares de autenticação e autorização (RNF03.7, RN01, RN12).
// - autenticar: verifica o Bearer JWT, resolve o setor (tipo) e anexa a
//   Identidade em req.identidade. Roda em TODA rota protegida.
// - exigir(predicado): guarda de RBAC reutilizável sobre a Identidade.
// =============================================================================
import type { Request, Response, NextFunction } from "express";
import { verificarToken } from "./jwt.js";
import type { Identidade } from "./rbac.js";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";

// Estende o Request do Express com a identidade autenticada.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      identidade?: Identidade;
    }
  }
}

/** Extrai o token "Bearer xxx" do header Authorization. */
function extrairToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/**
 * Verifica o token em toda rota protegida e popula req.identidade.
 * O tipo do setor (almoxarifado/destinatario) é resolvido via repositório,
 * pois o RBAC depende de "HO é global".
 */
export function autenticar(setorRepo: ISetorRepository) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extrairToken(req);
      if (!token) {
        res.status(401).json({ mensagem: "Token de autenticação ausente" });
        return;
      }
      const payload = verificarToken(token);
      const setor = await setorRepo.buscarPorId(payload.setorId);
      if (setor === null) {
        res.status(401).json({ mensagem: "Setor do usuário não encontrado" });
        return;
      }
      req.identidade = {
        usuarioId: payload.sub,
        perfil: payload.perfil,
        setorId: payload.setorId,
        setorTipo: setor.tipo,
      };
      next();
    } catch {
      res.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
  };
}

/**
 * Guarda de RBAC: recebe um predicado sobre a Identidade (e os params/body da
 * request) e responde 403 se reprovar. Ex.: exigir((id) => podeProcessarPedidos(id)).
 */
export function exigir(
  predicado: (id: Identidade, req: Request) => boolean,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.identidade;
    if (!id) {
      res.status(401).json({ mensagem: "Não autenticado" });
      return;
    }
    if (!predicado(id, req)) {
      res.status(403).json({ mensagem: "Acesso negado para o seu perfil/setor" });
      return;
    }
    next();
  };
}
