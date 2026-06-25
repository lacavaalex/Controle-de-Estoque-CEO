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
  lotesDoProduto: vi.fn().mockResolvedValue([
    { id: 101, numeroLote: "LT-2026-001", validade: "2028-06-30T00:00:00.000Z", quantidade: 30, estado: "ativo", estadoValidade: "valido" },
  ]),
  removerLote: vi.fn().mockResolvedValue({ ok: true }),
}));
import { estoqueDoSetor, catalogoDoSetor, lotesDoProduto, removerLote } from "../api/estoque.js";

describe("Estoque", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eu.mockImplementation(() => Promise.resolve(session.getUser()));
  });

  it("gestor vê a coluna Situação e os status", async () => {
    loginFake({ id: 7, nome: "Ana", perfil: "gestor", setorId: 1 });
    renderApp(<Estoque />);
    expect(await screen.findByText(/Luva/i)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /situação/i })).toBeInTheDocument();
    // "Crítico" aparece no <option> do filtro e no badge da linha; conferimos o badge.
    const linhaAnest = screen.getByText(/Anestésico X/i).closest("tr");
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
    await screen.findByText(/Luva/i);

    await user.type(screen.getByLabelText(/buscar/i), "anest");
    await user.click(screen.getByRole("button", { name: /^filtrar$/i }));

    await waitFor(() => {
      const ultima = estoqueDoSetor.mock.calls.at(-1);
      expect(ultima[1]).toMatchObject({ texto: "anest" });
    });
  });

  it("remover lote exibe modal de confirmação e remove ao confirmar", async () => {
    loginFake({ id: 7, nome: "Ana", perfil: "gestor", setorId: 1 });
    const user = userEvent.setup();
    renderApp(<Estoque />);
    
    // 1. Expandir a linha do produto "Luva" para ver seus lotes
    const linhaProduto = await screen.findByText(/Luva/i);
    await user.click(linhaProduto);
    
    // 2. Verificar que o lote "LT-2026-001" é exibido
    expect(await screen.findByText("LT-2026-001")).toBeInTheDocument();
    
    // 3. Clicar no botão "Remover" do lote
    const botaoRemover = screen.getByRole("button", { name: /^remover$/i });
    await user.click(botaoRemover);
    
    // 4. Modal "Tem certeza?" deve estar visível
    expect(screen.getByText("Tem certeza?")).toBeInTheDocument();
    
    // 5. Clicar no botão "Cancelar" fecha o modal
    const botaoCancelar = screen.getByRole("button", { name: /^cancelar$/i });
    await user.click(botaoCancelar);
    expect(screen.queryByText("Tem certeza?")).not.toBeInTheDocument();
    
    // 6. Clicar no botão "Remover" de novo
    await user.click(botaoRemover);
    expect(screen.getByText("Tem certeza?")).toBeInTheDocument();
    
    // Mock window.alert to avoid errors
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    
    // 7. Clicar no botão "Remover" no modal confirma a remoção
    const botoesRemover = screen.getAllByRole("button", { name: /^remover$/i });
    // O segundo botão "Remover" é o do modal
    const botaoConfirmarRemover = botoesRemover[1];
    await user.click(botaoConfirmarRemover);
    
    // 8. Deve chamar a API removerLote e fechar o modal
    expect(removerLote).toHaveBeenCalledWith(101);
    expect(screen.queryByText("Tem certeza?")).not.toBeInTheDocument();
    expect(alertMock).toHaveBeenCalledWith("Lote removido com sucesso!");
    alertMock.mockRestore();
  });
});
