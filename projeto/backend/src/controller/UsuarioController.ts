import type { Request, Response } from "express";
import type { IUsuarioRepository } from "../interfaces/repository-interfaces/IUsuarioRepo.js";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";

export class UsuarioController {
  constructor(private usuarioRepo: IUsuarioRepository) {}

  // US-EP01-07 — Lista usuários do escopo do gestor
  async listar(req: Request, res: Response): Promise<Response> {
    try {
      const id = (req as any).identity;
      const todos = await this.usuarioRepo.listar();

      // Gestor HO vê todos; gestor de outro setor vê só o seu setor
      const usuarios =
        id.setorTipo === "almoxarifado"
          ? todos
          : todos.filter((u) => u.setorId === id.setorId);

      // Nunca expõe senhaHash
      const seguros = usuarios.map(({ senhaHash, ...u }) => u);
      return res.status(200).json({ usuarios: seguros });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // US-EP01-07 — Desativa usuário (ativo = false)
  async desativar(req: Request, res: Response): Promise<Response> {
    try {
      const id = (req as any).identity;
      const alvoId = Number(req.params.id);

      const alvo = await this.usuarioRepo.buscarPorId(alvoId);
      if (!alvo) return res.status(404).json({ mensagem: "Usuário não encontrado." });

      // Gestor só pode desativar usuários do seu escopo
      if (id.setorTipo !== "almoxarifado" && alvo.setorId !== id.setorId) {
        return res.status(403).json({ mensagem: "Sem permissão para desativar este usuário." });
      }

      // Não pode desativar a si mesmo
      if (alvo.id === id.sub) {
        return res.status(400).json({ mensagem: "Você não pode desativar sua própria conta." });
      }

      await this.usuarioRepo.atualizar(alvoId, { ativo: false });
      return res.status(200).json({ mensagem: "Usuário desativado com sucesso." });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // US-EP01-07 — Reseta senha e força troca no próximo login
  async resetarSenha(req: Request, res: Response): Promise<Response> {
    try {
      const id = (req as any).identity;
      const alvoId = Number(req.params.id);

      const alvo = await this.usuarioRepo.buscarPorId(alvoId);
      if (!alvo) return res.status(404).json({ mensagem: "Usuário não encontrado." });

      // Gestor só pode resetar usuários do seu escopo
      if (id.setorTipo !== "almoxarifado" && alvo.setorId !== id.setorId) {
        return res.status(403).json({ mensagem: "Sem permissão para resetar a senha deste usuário." });
      }

      // Gera senha provisória legível (ex: "Ceo@Ab3x")
      const senhaProvisoria = "Ceo@" + randomBytes(3).toString("hex");
      const senhaHash = await bcrypt.hash(senhaProvisoria, 10);

      await this.usuarioRepo.atualizar(alvoId, { senhaHash, trocarSenha: true });

      return res.status(200).json({
        mensagem: "Senha resetada com sucesso.",
        senhaProvisoria, // enviada uma única vez; front deve exibir ao gestor
      });
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ mensagem: error.message });
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}