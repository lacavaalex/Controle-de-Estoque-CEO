import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// chave de teste
export const JWT_SECRET = "uma-chave-secreta";

interface TokenPayload {
    id: string;
    cargo: "gestor" | "almoxarife" | "solicitante";
    email: string;
}

export function verificarTokenJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensagem: "Token de autenticação não fornecido." });
    }

    const partes = authHeader.split(" ");
    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({ mensagem: "Token malformatado." });
    }

    const token = partes[1];

    try {
        const decodificado = jwt.verify(token, JWT_SECRET) as TokenPayload;
        
        // injeta os dados do usuário decodificado dentro do objeto da requisição
        // para que os próximos controllers saibam quem fez a ação
        (req as any).usuarioLogado = decodificado;

        return next();
    } catch (err) {
        return res.status(401).json({ mensagem: "Sessão inválida ou expirada. Faça login novamente." });
    }
}