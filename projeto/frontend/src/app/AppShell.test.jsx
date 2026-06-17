import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderApp, loginFake } from "../test/utils.jsx";
import AppShell from "./AppShell.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 7, perfil: "gestor", setorId: 1 }),
  logout: vi.fn().mockResolvedValue(undefined), provisionarUsuario: vi.fn(),
}));

function shellComRotas() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<div>pág dashboard</div>} />
      </Route>
    </Routes>
  );
}

describe("AppShell — navegação por perfil", () => {
  it("solicitante vê Novo pedido, mas não Processar pedidos", () => {
    loginFake({ id: 1, nome: "Rafael Moura", perfil: "solicitante", setorId: 2 });
    renderApp(shellComRotas(), { route: "/dashboard" });
    expect(screen.getByRole("link", { name: /novo pedido/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /processar pedidos/i })).not.toBeInTheDocument();
  });

  it("almoxarife vê Processar pedidos, mas não Novo pedido", () => {
    loginFake({ id: 3, nome: "João Silva", perfil: "almoxarife", setorId: 1 });
    renderApp(shellComRotas(), { route: "/dashboard" });
    expect(screen.getByRole("link", { name: /processar pedidos/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /novo pedido/i })).not.toBeInTheDocument();
  });

  it("gestor vê ambos e o nome/perfil aparece", () => {
    loginFake({ id: 7, nome: "Ana Costa", perfil: "gestor", setorId: 1 });
    renderApp(shellComRotas(), { route: "/dashboard" });
    expect(screen.getByRole("link", { name: /novo pedido/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /processar pedidos/i })).toBeInTheDocument();
    expect(screen.getByText("Ana Costa")).toBeInTheDocument();
    expect(screen.getByText("Gestor")).toBeInTheDocument();
  });
});
