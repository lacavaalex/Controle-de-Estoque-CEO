import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp, loginFake } from "../test/utils.jsx";
import Movimentacoes from "./Movimentacoes.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 3, perfil: "almoxarife", setorId: 1 }),
  logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
vi.mock("../api/dashboard.js", () => ({ ultimasMovimentacoes: vi.fn() }));
vi.mock("../api/setores.js", () => ({ listarSetores: vi.fn() }));

import { ultimasMovimentacoes } from "../api/dashboard.js";
import { listarSetores } from "../api/setores.js";

const SETORES = [
  { id: 1, nome: "HO", tipo: "almoxarifado" },
  { id: 2, nome: "CEO", tipo: "destinatario" },
];

const MOVS = [
  { id: "MOV-001", tipo: "saida", produtoNome: "Luvas M", quantidade: 10, setorOrigemNome: "HO", setorDestinoNome: "CEO", data: "2026-06-20T10:00:00.000Z" },
  { id: "MOV-002", tipo: "entrada", produtoNome: "Gaze", quantidade: 50, setorOrigemNome: "HO", setorDestinoNome: null, data: "2026-06-19T09:00:00.000Z" },
];

describe("Movimentações (log)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginFake({ id: 3, nome: "João", perfil: "almoxarife", setorId: 1 });
    listarSetores.mockResolvedValue(SETORES);
  });

  it("lista as movimentações do setor", async () => {
    ultimasMovimentacoes.mockResolvedValue(MOVS);
    renderApp(<Movimentacoes />);
    expect(await screen.findByText("Luvas M")).toBeInTheDocument();
    expect(screen.getByText("Gaze")).toBeInTheDocument();
  });

  it("filtra por tipo ao clicar num chip", async () => {
    ultimasMovimentacoes.mockResolvedValue(MOVS);
    const user = userEvent.setup();
    renderApp(<Movimentacoes />);
    await screen.findByText("Luvas M");

    await user.click(screen.getByRole("button", { name: "Entrada" }));

    // a última chamada deve passar tipo "entrada" no 2º arg (objeto de opções)
    const ultima = ultimasMovimentacoes.mock.calls.at(-1);
    expect(ultima[1]).toMatchObject({ tipo: "entrada" });
  });

  it("mostra estado vazio quando não há movimentações", async () => {
    ultimasMovimentacoes.mockResolvedValue([]);
    renderApp(<Movimentacoes />);
    expect(await screen.findByText(/sem movimentações/i)).toBeInTheDocument();
  });
});
