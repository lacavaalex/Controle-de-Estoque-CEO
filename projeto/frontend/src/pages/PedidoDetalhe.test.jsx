import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp, loginFake } from "../test/utils.jsx";
import { session } from "../api/client.js";
import PedidoDetalhe from "./PedidoDetalhe.jsx";

// eu() resolve para o usuário corrente, preservando o perfil de loginFake.
vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn(), logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
import { eu } from "../api/auth.js";
vi.mock("../api/pedidos.js", () => ({ obterPedido: vi.fn(), expedirItem: vi.fn() }));
import { obterPedido, expedirItem } from "../api/pedidos.js";

const PEDIDO = {
  id: "PED-001",
  status: "pendente",
  justificativa: "Reposição semanal do CEO",
  setorOrigemId: 2, setorDestinoId: 1,
  solicitante: { nome: "Rafael Moura" },
  itens: [
    { id: 101, produtoId: 12, produtoNome: "Luva de procedimento", qtdSolicitada: 4, qtdExpedida: 0, unidade: "caixa", statusItem: "pendente" },
    { id: 102, descricaoLivre: "Evidenciador de biofilme", qtdSolicitada: 2, qtdExpedida: 0, unidade: "frasco", statusItem: "pendente" },
  ],
};

describe("PedidoDetalhe — expedição item a item", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eu.mockImplementation(() => Promise.resolve(session.getUser()));
    loginFake({ id: 3, nome: "João", perfil: "almoxarife", setorId: 1 });
  });

  it("lista os itens do pedido", async () => {
    obterPedido.mockResolvedValue(PEDIDO);
    renderApp(<PedidoDetalhe />, { route: "/pedidos/PED-001", path: "/pedidos/:id" });
    expect(await screen.findByText("Luva de procedimento")).toBeInTheDocument();
    expect(screen.getByText("Evidenciador de biofilme")).toBeInTheDocument();
  });

  it("expedir um item chama a API e atualiza o status do item e do pedido", async () => {
    obterPedido.mockResolvedValue(PEDIDO);
    expedirItem.mockResolvedValue({
      item: { id: 101, statusItem: "atendido_integral", qtdExpedida: 4 },
      movimentacoes: ["MOV-001", "MOV-002"],
      statusPedido: "atendido_parcial",
    });
    const user = userEvent.setup();
    renderApp(<PedidoDetalhe />, { route: "/pedidos/PED-001", path: "/pedidos/:id" });

    const linhaLuva = (await screen.findByText("Luva de procedimento")).closest("tr");
    await user.click(within(linhaLuva).getByRole("button", { name: /expedir/i }));

    await waitFor(() => expect(expedirItem).toHaveBeenCalledWith("PED-001", 101));
    // item passou a "Atendido integral"
    await waitFor(() => expect(within(linhaLuva).getByText(/atendido integral/i)).toBeInTheDocument());
    // feedback de movimentação aparece
    expect(within(linhaLuva).getByText(/estoque CEO atualizado/i)).toBeInTheDocument();
  });

  it("item de linha livre não pode ser expedido diretamente", async () => {
    obterPedido.mockResolvedValue(PEDIDO);
    renderApp(<PedidoDetalhe />, { route: "/pedidos/PED-001", path: "/pedidos/:id" });
    const linhaLivre = (await screen.findByText("Evidenciador de biofilme")).closest("tr");
    expect(within(linhaLivre).getByRole("button", { name: /expedir/i })).toBeDisabled();
  });

  it("solicitante não vê botão de expedir (só visualiza)", async () => {
    loginFake({ id: 9, nome: "Rafael", perfil: "solicitante", setorId: 2 });
    obterPedido.mockResolvedValue(PEDIDO);
    renderApp(<PedidoDetalhe />, { route: "/pedidos/PED-001", path: "/pedidos/:id" });
    await screen.findByText("Luva de procedimento");
    expect(screen.queryByRole("button", { name: /expedir/i })).not.toBeInTheDocument();
  });

  it("mostra erro de expedição sem quebrar a tela", async () => {
    obterPedido.mockResolvedValue(PEDIDO);
    const { ApiError } = await import("../api/client.js");
    expedirItem.mockRejectedValue(new ApiError("Sem lote disponível", 400));
    const user = userEvent.setup();
    renderApp(<PedidoDetalhe />, { route: "/pedidos/PED-001", path: "/pedidos/:id" });

    const linhaLuva = (await screen.findByText("Luva de procedimento")).closest("tr");
    await user.click(within(linhaLuva).getByRole("button", { name: /expedir/i }));
    expect(await within(linhaLuva).findByText("Sem lote disponível")).toBeInTheDocument();
  });
});
