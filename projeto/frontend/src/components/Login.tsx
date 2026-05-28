import React, { useState } from "react";
import { efetuarLogin } from "../services/api";
import type { User } from "../types/user";

export function Login() {
    const [email, setEmail] = useState<string>("");
    const [senha, setSenha] = useState<string>("");
    
    const [erro, setErro] = useState<string>("");
    const [carregando, setCarregando] = useState<boolean>(false);
    
    const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);

    async function handleSubmeter(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); 
        setErro("");            
        setCarregando(true);    

        try {
            const dados = await efetuarLogin(email, senha);
            setUsuarioLogado(dados.usuario);

            // Salva no LocalStorage
            localStorage.setItem("usuario_ceo", JSON.stringify(dados.usuario));
        } catch (err) {
            if (err instanceof Error) {
                setErro(err.message);
            } else {
                setErro("Ocorreu um erro inesperado.");
            }
        } finally {
            setCarregando(false);
        }
    }

    if (usuarioLogado) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Bem-vindo, {usuarioLogado.nome}!</h2>
                <p>Seu cargo atual é: <strong>{usuarioLogado.cargo}</strong></p>
                <button onClick={() => {
                    localStorage.removeItem("usuario_ceo");
                    setUsuarioLogado(null);
                }}>
                    Sair da Conta
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>C.E.O. UFPE - Login (TS)</h2>
            
            {erro && <p style={{ color: "red", backgroundColor: "#ffe6e6", padding: "10px", borderRadius: "4px" }}>{erro}</p>}

            <form onSubmit={handleSubmeter}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>E-mail corporativo:</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                    />
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Senha:</label>
                    <input 
                        type="password" 
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={carregando}
                    style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    {carregando ? "Autenticando..." : "Entrar no Sistema"}
                </button>
            </form>
        </div>
    );
}