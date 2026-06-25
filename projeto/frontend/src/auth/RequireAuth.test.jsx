import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import { loginFake } from "../test/utils.jsx";
import RequireAuth from "./RequireAuth.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 7, perfil: "gestor", setorId: 1 }),
  logout: vi.fn(), provisionarUsuario: vi.fn(),
}));

function Protegido() { return <div>conteúdo protegido</div>; }

// RequireAuth sem sessão renderiza <Navigate to="/login">. O destino PRECISA
// existir no <Routes>: redirecionar para uma rota inexistente trava o
// react-router v7 no jsdom (loop de resolução). Por isso montamos um router
// real com a rota /login, em vez do renderApp "solto".
function renderGuarda(route = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/" element={<RequireAuth><Protegido /></RequireAuth>} />
          <Route path="/login" element={<div>tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("RequireAuth", () => {
  it("sem sessão, redireciona para /login", () => {
    renderGuarda("/");
    expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });

  it("com sessão, mostra o conteúdo", async () => {
    loginFake();
    renderGuarda("/");
    // Com token salvo, o AuthProvider inicia em "Carregando…" e revalida via
    // eu() (assíncrono); o conteúdo só aparece quando essa promessa resolve.
    expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
  });
});
