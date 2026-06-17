import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp, loginFake } from "../test/utils.jsx";
import Pedidos from "./Pedidos.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 3, perfil: "almoxarife", setorId: 1 }),
  logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
vi.mock("../api/pedidos.js", () => ({ pedidosDoSetor: vi.fn() }));
import { pedidosDoSetor } from "../api/pedidos.js";

const LISTA = [
  { id: "PED-001", solicitante: { nome: "Rafael" }, status: "pendente", itens: [{}, {}] },
  { id: "PED-002", solicitante: { nome: "Helena" }, status: "atendido_parcial", itens: [{}] },
];

describe("Pedidos (fila)", () => {
  beforeEach(() => { vi.clearAllMocks(); loginFake({ id: 3, nome: "João", perfil: "almoxarife", setorId: 1 }); });

  it("lista os pedidos do setor", async () => {
    pedidosDoSetor.mockResolvedValue(LISTA);
    renderApp(<Pedidos />);
    expect(await screen.findByText("PED-001")).toBeInTheDocument();
    expect(screen.getByText("PED-002")).toBeInTheDocument();
  });

  it("filtra por status ao clicar numa aba", async () => {
    pedidosDoSetor.mockResolvedValue(LISTA);
    const user = userEvent.setup();
    renderApp(<Pedidos />);
    await screen.findByText("PED-001");

    await user.click(screen.getByRole("button", { name: /pendentes/i }));
    // a última chamada deve incluir o status "pendente"
    const ultima = pedidosDoSetor.mock.calls.at(-1);
    expect(ultima[1]).toBe("pendente");
  });

  it("mostra estado vazio quando não há pedidos", async () => {
    pedidosDoSetor.mockResolvedValue([]);
    renderApp(<Pedidos />);
    expect(await screen.findByText(/nenhum pedido/i)).toBeInTheDocument();
  });
});
