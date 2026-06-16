import type { IUserService } from "../interfaces/service-interfaces/IUserService.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/authMiddleware.js";

export class UserController {
    constructor(private userService: IUserService) {}

    async login(req: Request, res: Response): Promise<Response> {
        const { email, senha } = req.body;

        try {
            const loggedUser = await this.userService.login(email, senha);
            
            const token = jwt.sign(
                { id: loggedUser.id, cargo: loggedUser.cargo, email: loggedUser.email },
                JWT_SECRET,
                { expiresIn: "8h" }
            );

            return res.status(200).json({ usuario: loggedUser, token });
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
                const statusCode = error.message.includes("Acesso Negado") ? 403 : 400;
                return res.status(statusCode).json({ mensagem: error.message });
            }
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }

    async update(req: Request, res: Response): Promise<Response> {
        // Tenta buscar o id de qualquer origem comum (params, query ou headers)
        const id = req.params.id || req.query.id || req.headers.id;
        const { email, senha } = req.body;

        try {
            // String(id) resolve o erro de tipo 'string | string[] | undefined'
            const updatedUser = await this.userService.update(String(id), { email, senha });
            return res.status(200).json({ usuario: updatedUser });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ mensagem: error.message });
            }
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }
}