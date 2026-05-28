import type { User } from "../types/user";

const BASE_URL = "http://localhost:3000";

export async function efetuarLogin(email: string, senha: string): Promise<{ usuario: User }> {
    try {
        const resposta = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Erro ao tentar se conectar ao servidor.");
        }

        return dados as { usuario: User };
    } catch (error) {
        throw error;
    }
}