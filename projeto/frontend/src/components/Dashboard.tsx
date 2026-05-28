import { useState } from "react";
import { Cadastro } from "./Cadastro";
import type { User } from "../types/user";

interface DashboardProps {
    usuario: User;
    onLogout: () => void;
}

export function Dashboard({ usuario, onLogout }: DashboardProps) {
    const [abaAtiva, setAbaAtiva] = useState<"estoque" | "usuarios">("estoque");

    return (
        <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
            <header style={{ 
                backgroundColor: "#003366", 
                color: "white", 
                padding: "15px 30px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>C.E.O. UFPE - Dashboard</h2>
                    <span style={{ fontSize: "14px", opacity: 0.8 }}>
                        Olá, <strong>{usuario.nome}</strong> ({usuario.cargo})
                    </span>
                </div>
                <button 
                    onClick={onLogout}
                    style={{ 
                        padding: "8px 16px", 
                        backgroundColor: "#dc3545", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "4px", 
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Sair do Sistema
                </button>
            </header>

            <nav style={{ 
                backgroundColor: "white", 
                borderBottom: "1px solid #ddd", 
                display: "flex", 
                padding: "0 30px" 
            }}>
                <button 
                    onClick={() => setAbaAtiva("estoque")}
                    style={{
                        padding: "15px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: abaAtiva === "estoque" ? "3px solid #003366" : "3px solid transparent",
                        color: abaAtiva === "estoque" ? "#003366" : "#666",
                        fontWeight: abaAtiva === "estoque" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Controle de Estoque
                </button>

                {usuario.cargo === "gestor" && (
                    <button 
                        onClick={() => setAbaAtiva("usuarios")}
                        style={{
                            padding: "15px 20px",
                            border: "none",
                            background: "none",
                            borderBottom: abaAtiva === "usuarios" ? "3px solid #003366" : "3px solid transparent",
                            color: abaAtiva === "usuarios" ? "#003366" : "#666",
                            fontWeight: abaAtiva === "usuarios" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        Cadastrar Usuário
                    </button>
                )}
            </nav>

            <main style={{ padding: "30px" }}>
                {abaAtiva === "estoque" && (
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <h3>Inventário</h3>
                        <p style={{ color: "#666" }}>
                            TESTE
                        </p>
                    </div>
                )}

                {abaAtiva === "usuarios" && usuario.cargo === "gestor" && (
                    <div>
                        <Cadastro />
                    </div>
                )}
            </main>
        </div>
    );
}