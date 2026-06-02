import type { IUserService } from "../interfaces/service-interfaces/IUserService.js";
import type { Request, Response } from "express";

export class UserController {
    constructor(private userService: IUserService) {}

    async login(req: Request, res: Response): Promise<Response> {
        const { email, senha } = req.body;

        try {
            const loggedUser = await this.userService.login(email, senha);
            return res.status(200).json({ usuario: loggedUser });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(401).json({ mensagem: error.message });
            }
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }

    async register(req: Request, res: Response): Promise<Response> {
        const { nome, email, senha, cargo, quemEstaCadastrando } = req.body;

        try {
            const newUser = await this.userService.register(
                { nome, email, senha, cargo },
                quemEstaCadastrando
            );
            return res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!", usuario: newUser });
        } catch (error) {
            if (error instanceof Error) {
                // Erros de permissão negada tradicionalmente usam o status 403 (Forbidden)
                const statusCode = error.message.includes("Acesso Negado") ? 403 : 400;
                return res.status(statusCode).json({ mensagem: error.message });
            }
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }
}