import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp, loginFake } from "../test/utils.jsx";
import { session } from "../api/client.js";
import Estoque from "./Estoque.jsx";

// eu() revalida a sessão no AuthContext; aqui resolve para o usuário corrente,
// preservando o perfil definido por loginFake em cada teste.
vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn(), logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
import { eu } from "../api/auth.js";
vi.mock("../api/setores.js", () => ({
  listarSetores: vi.fn().mockResolvedValue([{ id: 1, nome: "Almoxarifado HO", tipo: "almoxarifado" }]),
}));
vi.mock("../api/estoque.js", () => ({
  estoqueDoSetor: vi.fn().mockResolvedValue([
    { produtoId: 12, nome: "Luva", categoria: "EPI", unidade: "caixa", qtdTotal: 30, status: "OK" },
    { produtoId: 13, nome: "Anestésico X", categoria: "Anestésico", unidade: "tubo", qtdTotal: 2, status: "Crítico" },
  ]),
  catalogoDoSetor: vi.fn().mockResolvedValue([
    { produtoId: 12, nome: "Luva", categoria: "EPI", unidade: "caixa", qtdTotal: 30, status: "OK" },
  ]),
}));
import { estoqueDoSetor, catalogoDoSetor } from "../api/estoque.js";

describe("Estoque", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eu.mockImplementation(() => Promise.resolve(session.getUser()));
  });

  it("gestor vê a coluna Situação e os status", async () => {
    loginFake({ id: 7, nome: "Ana", perfil: "gestor", setorId: 1 });
    renderApp(<Estoque />);
    // exact:false porque na visão de gestor a célula vem com o prefixo "▶ " do
    // expansor de lotes (▶ Luva), então o texto não é exatamente "Luva".
    expect(await screen.findByText("Luva", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /situação/i })).toBeInTheDocument();
    // "Crítico" aparece no <option> do filtro e no badge da linha; conferimos o badge.
    // exact:false pelo mesmo prefixo "▶ " da visão de gestor (▶ Anestésico X).
    const linhaAnest = screen.getByText("Anestésico X", { exact: false }).closest("tr");
    expect(within(linhaAnest).getByText("Crítico")).toBeInTheDocument();
    expect(estoqueDoSetor).toHaveBeenCalled();
  });

  it("solicitante usa o catálogo e NÃO vê a coluna Situação", async () => {
    loginFake({ id: 9, nome: "Rafael", perfil: "solicitante", setorId: 1 });
    renderApp(<Estoque />);
    expect(await screen.findByText("Luva")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /situação/i })).not.toBeInTheDocument();
    expect(catalogoDoSetor).toHaveBeenCalled();
    expect(estoqueDoSetor).not.toHaveBeenCalled();
  });

  it("aplicar filtro repassa texto/categoria para a API", async () => {
    loginFake({ id: 7, nome: "Ana", perfil: "gestor", setorId: 1 });
    const user = userEvent.setup();
    renderApp(<Estoque />);
    await screen.findByText("Luva", { exact: false }); // prefixo "▶ " na visão de gestor

    await user.type(screen.getByLabelText(/buscar/i), "anest");
    await user.click(screen.getByRole("button", { name: /^filtrar$/i }));

    await waitFor(() => {
      const ultima = estoqueDoSetor.mock.calls.at(-1);
      expect(ultima[1]).toMatchObject({ texto: "anest" });
    });
  });
});
