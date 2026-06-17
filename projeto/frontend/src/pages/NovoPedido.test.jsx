import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp, loginFake } from "../test/utils.jsx";
import { session } from "../api/client.js";
import NovoPedido from "./NovoPedido.jsx";

// eu() resolve para o usuário corrente, preservando o setor de loginFake.
vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn(), logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
import { eu } from "../api/auth.js";
vi.mock("../api/setores.js", () => ({
  listarSetores: vi.fn().mockResolvedValue([
    { id: 1, nome: "Almoxarifado HO", tipo: "almoxarifado" },
    { id: 2, nome: "CEO", tipo: "destinatario" },
  ]),
}));
vi.mock("../api/estoque.js", () => ({
  catalogoDoSetor: vi.fn().mockResolvedValue([
    { produtoId: 12, nome: "Luva de procedimento" },
    { produtoId: 13, nome: "Máscara cirúrgica" },
  ]),
}));
vi.mock("../api/pedidos.js", () => ({ criarPedido: vi.fn() }));
import { criarPedido } from "../api/pedidos.js";

describe("NovoPedido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eu.mockImplementation(() => Promise.resolve(session.getUser()));
    loginFake({ id: 7, nome: "Rafael", perfil: "solicitante", setorId: 2 });
  });

  it("bloqueia e avisa quando origem e destino são o mesmo setor (número vs string)", async () => {
    // solicitante do setor 1, que é o mesmo do almoxarifado-padrão de destino.
    loginFake({ id: 7, nome: "Rafael", perfil: "solicitante", setorId: 1 });
    const user = userEvent.setup();
    renderApp(<NovoPedido />);
    await screen.findByRole("option", { name: "Luva de procedimento" });

    await user.type(screen.getByLabelText(/justificativa/i), "Reposição semanal do CEO");
    await user.selectOptions(screen.getByLabelText(/produto/i), "12");

    expect(screen.getByText(/setores diferentes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar pedido/i })).toBeDisabled();
  });

  it("mantém o botão desabilitado até a justificativa ter 10+ caracteres e um item válido", async () => {
    const user = userEvent.setup();
    renderApp(<NovoPedido />);
    // espera o catálogo carregar
    await screen.findByRole("option", { name: "Luva de procedimento" });

    const botao = screen.getByRole("button", { name: /criar pedido/i });
    expect(botao).toBeDisabled();

    // justificativa curta → ainda desabilitado
    await user.type(screen.getByLabelText(/justificativa/i), "curta");
    expect(botao).toBeDisabled();

    // justificativa ok + produto selecionado → habilita
    await user.clear(screen.getByLabelText(/justificativa/i));
    await user.type(screen.getByLabelText(/justificativa/i), "Reposição semanal do CEO");
    await user.selectOptions(screen.getByLabelText(/produto/i), "12");
    await waitFor(() => expect(botao).toBeEnabled());
  });

  it("envia payload com produtoId (modo catálogo), sem descricaoLivre", async () => {
    criarPedido.mockResolvedValue({ id: "PED-001", status: "pendente", itens: [] });
    const user = userEvent.setup();
    renderApp(<NovoPedido />);
    await screen.findByRole("option", { name: "Luva de procedimento" });

    await user.type(screen.getByLabelText(/justificativa/i), "Reposição semanal do CEO");
    await user.selectOptions(screen.getByLabelText(/produto/i), "12");
    await user.clear(screen.getByLabelText(/quantidade/i));
    await user.type(screen.getByLabelText(/quantidade/i), "4");
    await user.click(screen.getByRole("button", { name: /criar pedido/i }));

    await waitFor(() => expect(criarPedido).toHaveBeenCalledTimes(1));
    const payload = criarPedido.mock.calls[0][0];
    expect(payload).toMatchObject({
      setorOrigemId: 2, setorDestinoId: 1, solicitanteId: 7,
      justificativa: "Reposição semanal do CEO",
    });
    expect(payload.itens[0]).toEqual({ produtoId: 12, qtdSolicitada: 4, unidade: "unidade" });
    expect(payload.itens[0]).not.toHaveProperty("descricaoLivre");
  });

  it("modo linha livre envia descricaoLivre e nunca produtoId (regra XOR)", async () => {
    criarPedido.mockResolvedValue({ id: "PED-002", status: "pendente", itens: [] });
    const user = userEvent.setup();
    renderApp(<NovoPedido />);
    await screen.findByRole("option", { name: "Luva de procedimento" });

    await user.type(screen.getByLabelText(/justificativa/i), "Item fora do catálogo padrão");
    await user.click(screen.getByRole("button", { name: /linha livre/i }));
    await user.type(screen.getByLabelText(/descrição/i), "Evidenciador de biofilme");
    await user.click(screen.getByRole("button", { name: /criar pedido/i }));

    await waitFor(() => expect(criarPedido).toHaveBeenCalledTimes(1));
    const item = criarPedido.mock.calls[0][0].itens[0];
    expect(item).toHaveProperty("descricaoLivre", "Evidenciador de biofilme");
    expect(item).not.toHaveProperty("produtoId");
  });

  it("permite adicionar e remover itens", async () => {
    const user = userEvent.setup();
    renderApp(<NovoPedido />);
    await screen.findByRole("option", { name: "Luva de procedimento" });

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /adicionar item/i }));
    expect(screen.getByText("Item 2")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /remover/i })[0]);
    expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
  });
});
