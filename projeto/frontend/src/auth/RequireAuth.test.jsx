import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderApp, loginFake } from "../test/utils.jsx";
import RequireAuth from "./RequireAuth.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 7, perfil: "gestor", setorId: 1 }),
  logout: vi.fn(), provisionarUsuario: vi.fn(),
}));

function Protegido() { return <div>conteúdo protegido</div>; }

describe("RequireAuth", () => {
  it("sem sessão, redireciona para /login", () => {
    renderApp(
      <RequireAuth><Protegido /></RequireAuth>,
      { route: "/", },
    );
    expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
  });

  it("com sessão, mostra o conteúdo", () => {
    loginFake();
    renderApp(<RequireAuth><Protegido /></RequireAuth>);
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });
});
