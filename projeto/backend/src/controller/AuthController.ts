import type { Request, Response } from "express";
import type { AuthService } from "../services/AuthService.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<Response> {
    const { email, senha } = req.body ?? {};
    try {
      const resultado = await this.authService.login({ email, senha });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof Error) return res.status(401).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  // Logout: com JWT stateless, o cliente descarta o token. Endpoint existe para
  // simetria e para futura denylist (ADR-0005).
  async logout(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ mensagem: "Logout efetuado. Descarte o token no cliente." });
  }

  // Dados do usuário autenticado (a partir da Identidade do middleware).
  async eu(req: Request, res: Response): Promise<Response> {
    if (!req.identidade) return res.status(401).json({ mensagem: "Não autenticado" });
    return res.status(200).json({ identidade: req.identidade });
  }

  // Provisionamento de usuário por gestor (criação — sem cadastro público).
  async provisionar(req: Request, res: Response): Promise<Response> {
    if (!req.identidade) return res.status(401).json({ mensagem: "Não autenticado" });
    const { nome, email, cargo, perfil, setorId, senhaProvisoria } = req.body ?? {};
    try {
      const usuario = await this.authService.provisionarUsuario(req.identidade, {
        nome,
        email,
        cargo,
        perfil,
        setorId,
        senhaProvisoria,
      });
      return res.status(201).json({ mensagem: "Usuário provisionado com sucesso", usuario });
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message.includes("Acesso negado") ? 403 : 400;
        return res.status(status).json({ mensagem: error.message });
      }
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
