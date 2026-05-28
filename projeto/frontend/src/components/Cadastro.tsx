import React, { useState, useEffect } from "react";
import { efetuarCadastro } from "../services/api";
import type { User, RegisterDto } from "../types/user";

export function Cadastro() {
    const [gestorLogado, setGestorLogado] = useState<User | null>(null);

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [cargo, setCargo] = useState<"gestor" | "almoxarife" | "solicitante">("solicitante");

    const [sucesso, setSucesso] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        const dadosSessao = localStorage.getItem("usuario_ceo");
        if (dadosSessao) {
            setGestorLogado(JSON.parse(dadosSessao));
        }
    }, []);

    if (!gestorLogado || gestorLogado.cargo !== "gestor") {
        return (
            <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
                <h2>Acesso Negado</h2>
                <p>Apenas Gestores do CEO têm permissão para acessar a tela de cadastro de usuários.</p>
            </div>
        );
    }

    async function handleCadastrar(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro("");
        setSucesso("");
        setCarregando(true);

        const novoUsuario: RegisterDto = { nome, email, senha, cargo };

        try {
            const resposta = await efetuarCadastro(novoUsuario, gestorLogado.email);
            
            setSucesso(resposta.mensagem);

            setNome("");
            setEmail("");
            setSenha("");
            setCargo("solicitante");
        } catch (err) {
            if (err instanceof Error) {
                setErro(err.message); // para exibir "usuário já cadastrado..." ou travas do back
            }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div style={{ maxWidth: "450px", margin: "30px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Painel do Gestor: Cadastrar Novo Usuário</h3>
            <p style={{ fontSize: "12px", color: "#666" }}>Autorizador ativo: {gestorLogado.nome} ({gestorLogado.email})</p>
            
            {sucesso && <p style={{ color: "green", backgroundColor: "#e6ffe6", padding: "10px", borderRadius: "4px" }}>{sucesso}</p>}
            {erro && <p style={{ color: "red", backgroundColor: "#ffe6e6", padding: "10px", borderRadius: "4px" }}>{erro}</p>}

            <form onSubmit={handleCadastrar}>
                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px" }}>Nome Completo:</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: "100%", padding: "6px" }} />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px" }}>E-mail:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "6px" }} />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "4px" }}>Senha Inicial:</label>
                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: "100%", padding: "6px" }} />
                </div>

                <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", marginBottom: "4px" }}>Cargo no C.E.O:</label>
                    <select value={cargo} onChange={(e) => setCargo(e.target.value as any)} style={{ width: "100%", padding: "6px" }}>
                        <option value="solicitante">Solicitante</option>
                        <option value="almoxarife">Almoxarife</option>
                        <option value="gestor">Gestor</option>
                    </select>
                </div>

                <button type="submit" disabled={carregando} style={{ width: "100%", padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    {carregando ? "Salvando no Banco..." : "Confirmar Cadastro"}
                </button>
            </form>
        </div>
    );
}