import { useState } from "react";
import { Cadastro } from "./Cadastro";
import type { User } from "../types/user";

interface DashboardProps {
    usuario: User;
    onLogout: () => void;
}

export function Dashboard({ usuario, onLogout }: DashboardProps) {
    // Abas expandidas para idealizar o fluxo completo do MVP (CEO-201)
    const [abaAtiva, setAbaAtiva] = useState<"estoque" | "pedidos" | "movimentacoes" | "usuarios">("estoque");

    // Definição de cor da UFPE (RNF01.1)
    const COR_UFPE = "#990000";

    return (
        <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
            {/* Header com a identidade visual Bordô UFPE */}
            <header style={{ 
                backgroundColor: COR_UFPE, 
                color: "white", 
                padding: "15px 30px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>C.E.O. Estoque UFPE - Painel</h2>
                    <span style={{ fontSize: "14px", opacity: 0.9 }}>
                        Usuário: <strong>{usuario.nome}</strong> | Perfil: <span style={{ textTransform: "uppercase" }}>{usuario.cargo}</span>
                    </span>
                </div>
                <button 
                    onClick={onLogout}
                    style={{ 
                        padding: "8px 16px", 
                        backgroundColor: "#222222", 
                        color: "white", 
                        border: "1px solid rgba(255,255,255,0.3)", 
                        borderRadius: "4px", 
                        cursor: "pointer",
                        fontWeight: "bold",
                        transition: "0.2s"
                    }}
                >
                    Sair do Sistema
                </button>
            </header>

            {/* Menu de Abas - Idealização das seções futuras do sistema */}
            <nav style={{ 
                backgroundColor: "white", 
                borderBottom: "1px solid #ddd", 
                display: "flex", 
                padding: "0 30px",
                gap: "5px"
            }}>
                <button 
                    onClick={() => setAbaAtiva("estoque")}
                    style={{
                        padding: "15px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: abaAtiva === "estoque" ? `3px solid ${COR_UFPE}` : "3px solid transparent",
                        color: abaAtiva === "estoque" ? COR_UFPE : "#666",
                        fontWeight: abaAtiva === "estoque" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Visualizar Estoque
                </button>

                <button 
                    onClick={() => setAbaAtiva("pedidos")}
                    style={{
                        padding: "15px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: abaAtiva === "pedidos" ? `3px solid ${COR_UFPE}` : "3px solid transparent",
                        color: abaAtiva === "pedidos" ? COR_UFPE : "#666",
                        fontWeight: abaAtiva === "pedidos" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Pedidos / Solicitações <span style={{ backgroundColor: "#eee", padding: "2px 6px", borderRadius: "10px", fontSize: "11px", marginLeft: "4px", fontWeight: "bold" }}>MOCK</span>
                </button>

                <button 
                    onClick={() => setAbaAtiva("movimentacoes")}
                    style={{
                        padding: "15px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: abaAtiva === "movimentacoes" ? `3px solid ${COR_UFPE}` : "3px solid transparent",
                        color: abaAtiva === "movimentacoes" ? COR_UFPE : "#666",
                        fontWeight: abaAtiva === "movimentacoes" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Histórico / Logs <span style={{ backgroundColor: "#eee", padding: "2px 6px", borderRadius: "10px", fontSize: "11px", marginLeft: "4px", fontWeight: "bold" }}>MOCK</span>
                </button>

                {usuario.cargo === "gestor" && (
                    <button 
                        onClick={() => setAbaAtiva("usuarios")}
                        style={{
                            padding: "15px 20px",
                            border: "none",
                            background: "none",
                            borderBottom: abaAtiva === "usuarios" ? `3px solid ${COR_UFPE}` : "3px solid transparent",
                            color: abaAtiva === "usuarios" ? COR_UFPE : "#666",
                            fontWeight: abaAtiva === "usuarios" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        Gerenciar Usuários
                    </button>
                )}
            </nav>

            {/* Conteúdo Principal */}
            <main style={{ padding: "30px" }}>
                
                {/* Seção 1: Estoque Principal e Visão de KPIs */}
                {abaAtiva === "estoque" && (
                    <div>
                        {/* Bloco de Monitoramento / KPIs Mapeados por Perfil (US-EP05-01) */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: `5px solid ${COR_UFPE}` }}>
                                <h5 style={{ margin: "0 0 8px 0", color: "#666", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>Produtos em Catálogo</h5>
                                <h2 style={{ margin: 0, color: "#333" }}>42</h2>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "green" }}>● Todos os itens sincronizados</p>
                            </div>
                            
                            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #ffc107" }}>
                                <h5 style={{ margin: "0 0 8px 0", color: "#666", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>Lotes Vencendo (≤ 60 dias)</h5>
                                <h2 style={{ margin: 0, color: "#333" }}>03</h2>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#856404" }}>Requer atenção do Almoxarifado</p>
                            </div>

                            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #dc3545" }}>
                                <h5 style={{ margin: "0 0 8px 0", color: "#666", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>Estoque Crítico / Em falta</h5>
                                <h2 style={{ margin: 0, color: "#333" }}>01</h2>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#721c24" }}>Abaixo do estoque mínimo</p>
                            </div>

                            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #17a2b8" }}>
                                <h5 style={{ margin: "0 0 8px 0", color: "#666", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>Demanda Represada</h5>
                                <h2 style={{ margin: 0, color: "#333" }}>02</h2>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#117a8b" }}>Pedidos aguardando reposição</p>
                            </div>
                        </div>

                        {/* Tabela Física Existente */}
                        <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <h3 style={{ margin: 0, color: "#333" }}>Inventário Atualizado</h3>
                                <span style={{ fontSize: "12px", padding: "4px 8px", backgroundColor: "#e6f4ea", color: "#137333", borderRadius: "4px", fontWeight: "bold" }}>Setor Ativo: CEO Piloto</span>
                            </div>
                            <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
                                Este espaço está pronto para receber a tabela de mapeamento físico e conexão com o banco JSON. A listagem de insumos e as ações de ajuste de consumo clínico serão acopladas aqui.
                            </p>
                            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px dashed #ccc", textAlign: "center", color: "#777", fontSize: "13px" }}>
                                [ Área reservada para renderização do Catálogo / US-EP02-01 ]
                            </div>
                        </div>
                    </div>
                )}

                {/* Seção 2: Idealização de Pedidos/Solicitações (Mock) */}
                {abaAtiva === "pedidos" && (
                    <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>Mapeamento Visual: Fluxo de Pedidos Multi-Item</h3>
                        <p style={{ color: "#666", fontSize: "14px" }}>
                            Idealização em conformidade com o Épico <strong>EP04</strong>. Esta área concentrará a fila de requisições enviadas e recebidas para substituir totalmente o fluxo informal por e-mail.
                        </p>
                        
                        {/* Abas internas simuladas */}
                        <div style={{ display: "flex", gap: "10px", margin: "20px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            <span style={{ fontWeight: "bold", borderBottom: "2px solid #333", paddingBottom: "5px", cursor: "pointer", fontSize: "13px" }}>Pendentes (3)</span>
                            <span style={{ color: "#999", paddingBottom: "5px", cursor: "pointer", fontSize: "13px" }}>Em Processamento (2)</span>
                            <span style={{ color: "#999", paddingBottom: "5px", cursor: "pointer", fontSize: "13px" }}>Concluídos (5)</span>
                            <span style={{ color: "#999", paddingBottom: "5px", cursor: "pointer", fontSize: "13px" }}>Aguardando Reposição (1)</span>
                        </div>

                        <div style={{ padding: "30px", border: "2px dashed #e0e0e0", borderRadius: "6px", textAlign: "center", backgroundColor: "#fafafa" }}>
                            <p style={{ margin: 0, color: "#999", fontSize: "14px", fontWeight: "bold" }}>
                                Espaço reservado para o processamento item-a-item e sugestão de lotes (FEFO).
                            </p>
                            <p style={{ margin: "5px 0 0 0", color: "#bbb", fontSize: "12px" }}>
                                Aguardando conclusão das lógicas de backend dos demais integrantes da equipe.
                            </p>
                        </div>
                    </div>
                )}

                {/* Seção 3: Idealização de Movimentações/Logs (Mock) */}
                {abaAtiva === "movimentacoes" && (
                    <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>Log de Movimentações & Auditoria</h3>
                        <p style={{ color: "#666", fontSize: "14px" }}>
                            Idealização em conformidade com o requisito de rastreabilidade <strong>RNF07.1</strong> e story <strong>US-EP05-05</strong>. Toda e qualquer entrada, saída, descarte ou ajuste de inventário deixará um registro imutável aqui.
                        </p>
                        
                        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "4px", fontSize: "13px", color: "#555", borderLeft: "4px solid #28a745" }}>
                                <strong>[ENTRADA MOCK]</strong> - Lote 458/24 de Luva P inserido no catálogo - Qtd: +120 unidades.
                            </div>
                            <div style={{ padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "4px", fontSize: "13px", color: "#555", borderLeft: "4px solid #ffc107" }}>
                                <strong>[CONSUMO MOCK]</strong> - 3 unidades de Gaze baixadas por Uso Clínico no setor CEO.
                            </div>
                        </div>
                    </div>
                )}

                {/* Seção 4: Fluxo Real de Cadastro/Reset de Usuários */}
                {abaAtiva === "usuarios" && usuario.cargo === "gestor" && (
                    <div>
                        <Cadastro />
                    </div>
                )}
            </main>
        </div>
    );
}