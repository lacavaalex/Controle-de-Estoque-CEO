import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "../test/utils.jsx";
import Login from "./Login.jsx";
import { ApiError } from "../api/client.js";

// Mock da API de auth usada pelo AuthContext.
vi.mock("../api/auth.js", () => ({
  login: vi.fn(),
  eu: vi.fn().mockResolvedValue({ id: 1, perfil: "gestor", setorId: 1 }),
  logout: vi.fn(),
  provisionarUsuario: vi.fn(),
}));
import * as authApi from "../api/auth.js";

describe("Login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra os campos e a marca do sistema", () => {
    renderApp(<Login />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByText(/Estoque HO/i)).toBeInTheDocument();
  });

  it("faz login com sucesso e chama a API com e-mail aparado", async () => {
    authApi.login.mockResolvedValue({ usuario: { id: 1, nome: "Ana", perfil: "gestor", setorId: 1 } });
    const user = userEvent.setup();
    renderApp(<Login />);

    await user.type(screen.getByLabelText(/e-mail/i), "  ana@ufpe.br  ");
    await user.type(screen.getByLabelText(/senha/i), "ceoufpe2026");
    await user.click(screen.getByRole("button", { name: /entrar no sistema/i }));

    await waitFor(() => expect(authApi.login).toHaveBeenCalledWith("ana@ufpe.br", "ceoufpe2026"));
  });

  it("exibe a mensagem de erro da API em caso de credencial inválida", async () => {
    authApi.login.mockRejectedValue(new ApiError("E-mail ou senha incorretos!", 401));
    const user = userEvent.setup();
    renderApp(<Login />);

    await user.type(screen.getByLabelText(/e-mail/i), "x@ufpe.br");
    await user.type(screen.getByLabelText(/senha/i), "errada");
    await user.click(screen.getByRole("button", { name: /entrar no sistema/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos!");
  });
});
