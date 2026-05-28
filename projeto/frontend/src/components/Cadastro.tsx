import React, { useState, useEffect } from "react";

import { efetuarCadastro, efetuarEdicao } from "../services/api";

import type { User, RegisterDto } from "../types/user";



export function Cadastro() {

    const [gestorLogado, setGestorLogado] = useState<User | null>(null);



    // CEO-201: Estado para alternar entre modo "cadastro" e modo "edicao"

    const [modo, setModo] = useState<"cadastro" | "edicao">("cadastro");

    const [idUsuario, setIdUsuario] = useState("");



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



    function alternarModo(novoModo: "cadastro" | "edicao") {

        setModo(novoModo);

        setErro("");

        setSucesso("");

        setNome("");

        setEmail("");

        setSenha("");

        setIdUsuario("");

        setCargo("solicitante");

    }



    if (!gestorLogado || gestorLogado.cargo !== "gestor") {

        return (

            <div style={{ padding: "20px", color: "red", textAlign: "center" }}>

                <h2>Acesso Negado</h2>

                <p>Apenas Gestores do CEO têm permissão para acessar a tela de gerenciamento de usuários.</p>

            </div>

        );

    }



    async function handleSalvar(event: React.FormEvent<HTMLFormElement>) {

        event.preventDefault();

        setErro("");

        setSucesso("");

        setCarregando(true);



        if (!gestorLogado) {

            setErro("Sessão do usuário expirou. Faça login novamente.");

            setCarregando(false);

            return;

        }



        try {

            if (modo === "cadastro") {

                const novoUsuario: RegisterDto = { nome, email, senha, cargo };

                const resposta = await efetuarCadastro(novoUsuario, gestorLogado.email);

                setSucesso(resposta.mensagem || "Usuário cadastrado com sucesso!");

               

                setNome("");

                setCargo("solicitante");

                setEmail("");

            } else {

                if (!idUsuario.trim()) {

                    throw new Error("Por favor, informe o ID do usuário que deseja editar.");

                }

               

                // CEO-199: Envia apenas a senha para atualização

                await efetuarEdicao(idUsuario, { senha });

                setSucesso(`A senha do usuário com ID [${idUsuario}] foi atualizada com sucesso no arquivo JSON!`);

                setIdUsuario("");

            }



            setSenha("");

        } catch (err) {

            if (err instanceof Error) {

                setErro(err.message);

            }

        } finally {

            setCarregando(false);

        }

    }



    return (

        <div style={{ maxWidth: "450px", margin: "30px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#fff" }}>

           

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>

                <button

                    type="button"

                    onClick={() => alternarModo("cadastro")}

                    style={{

                        flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer",

                        backgroundColor: modo === "cadastro" ? "#0056b3" : "#f8f9fa",

                        color: modo === "cadastro" ? "white" : "#333",

                        fontWeight: modo === "cadastro" ? "bold" : "normal"

                    }}

                >

                    Novo Cadastro

                </button>

                <button

                    type="button"

                    onClick={() => alternarModo("edicao")}

                    style={{

                        flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer",

                        backgroundColor: modo === "edicao" ? "#0056b3" : "#f8f9fa",

                        color: modo === "edicao" ? "white" : "#333",

                        fontWeight: modo === "edicao" ? "bold" : "normal"

                    }}

                >

                    Resetar Senha

                </button>

            </div>



            <h3 style={{ marginTop: 0 }}>

                {modo === "cadastro" ? "Painel do Gestor: Cadastrar Novo Usuário" : "Painel do Gestor: Resetar Senha de Usuário"}

            </h3>

            <p style={{ fontSize: "12px", color: "#666" }}>Autorizador ativo: {gestorLogado.nome} ({gestorLogado.email})</p>

           

            {sucesso && <p style={{ color: "green", backgroundColor: "#e6ffe6", padding: "10px", borderRadius: "4px" }}>{sucesso}</p>}

            {erro && <p style={{ color: "red", backgroundColor: "#ffe6e6", padding: "10px", borderRadius: "4px" }}>{erro}</p>}



            <form onSubmit={handleSalvar}>

                {modo === "edicao" && (

                    <div style={{ marginBottom: "12px" }}>

                        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>ID do Usuário:</label>

                        <input type="text" value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} required placeholder="Ex: 003" style={{ width: "100%", padding: "6px", border: "1px solid #0056b3" }} />

                    </div>

                )}



                {modo === "cadastro" && (

                    <div style={{ marginBottom: "12px" }}>

                        <label style={{ display: "block", marginBottom: "4px" }}>Nome Completo:</label>

                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: "100%", padding: "6px" }} />

                    </div>

                )}



                {modo === "cadastro" && (

                    <div style={{ marginBottom: "12px" }}>

                        <label style={{ display: "block", marginBottom: "4px" }}>E-mail:</label>

                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "6px" }} />

                    </div>

                )}



                <div style={{ marginBottom: "12px" }}>

                    <label style={{ display: "block", marginBottom: "4px" }}>

                        {modo === "cadastro" ? "Senha Inicial:" : "Nova Senha para Atualizar:"}

                    </label>

                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: "100%", padding: "6px" }} />

                </div>



                {modo === "cadastro" && (

                    <div style={{ marginBottom: "18px" }}>

                        <label style={{ display: "block", marginBottom: "4px" }}>Cargo:</label>

                        <select value={cargo} onChange={(e) => setCargo(e.target.value as any)} style={{ width: "100%", padding: "6px" }}>

                            <option value="solicitante">Solicitante</option>

                            <option value="almoxarife">Almoxarife</option>

                            <option value="gestor">Gestor</option>

                        </select>

                    </div>

                )}



                <button

                    type="submit"

                    disabled={carregando}

                    style={{

                        width: "100%", padding: "10px", border: "none", borderRadius: "4px", cursor: "pointer",

                        backgroundColor: modo === "cadastro" ? "#28a745" : "#ffc107",

                        color: modo === "cadastro" ? "white" : "#212529",

                        fontWeight: "bold"

                    }}

                >

                    {carregando ? "Processando..." : modo === "cadastro" ? "Confirmar Cadastro" : "Confirmar Nova Senha"}

                </button>

            </form>

        </div>

    );

} 

