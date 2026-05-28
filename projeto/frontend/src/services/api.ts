import type { User, RegisterDto } from "../types/user";

const BASE_URL = "http://localhost:3000";

/**
 * Envia uma requisição POST para efetuar o login do usuário
 */
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

/**
 * Envia uma requisição POST para cadastrar um novo usuário (Mapeia a task CEO-201)
 */
export async function efetuarCadastro(
    dados: RegisterDto, 
    quemEstaCadastrando: string
): Promise<{ mensagem: string; usuario: User }> {
    try {
        const resposta = await fetch(`${BASE_URL}/registrar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ...dados, quemEstaCadastrando })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || "Erro ao tentar registrar usuário.");
        }

        return resultado as { mensagem: string; usuario: User };
    } catch (error) {
        throw error;
    }
}

/**
 * Envia uma requisição PUT para atualizar dados do usuário por ID (Mapeia a task CEO-199)
 * @param id ID do usuário no banco JSON (ex: "003")
 * @param dados Objeto contendo apenas a senha a ser atualizada
 */
export async function efetuarEdicao(
    id: string,
    dados: { senha?: string }
): Promise<{ usuario: User }> {
    try {
        const resposta = await fetch(`${BASE_URL}/usuarios/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || "Erro ao tentar atualizar dados do usuário.");
        }

        return resultado as { usuario: User };
    } catch (error) {
        throw error;
    }
}