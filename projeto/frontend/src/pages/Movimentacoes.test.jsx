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

  it("passa o intervalo de datas para a API ao preencher os filtros (CEO-252)", async () => {
    ultimasMovimentacoes.mockResolvedValue(MOVS);
    const user = userEvent.setup();
    const { container } = renderApp(<Movimentacoes />);
    await screen.findByText("Luvas M");

    const [de, ate] = container.querySelectorAll('input[type="date"]');
    await user.type(de, "2026-06-01");
    await user.type(ate, "2026-06-30");

    const ultima = ultimasMovimentacoes.mock.calls.at(-1);
    expect(ultima[1]).toMatchObject({ dataInicio: "2026-06-01", dataFim: "2026-06-30" });
  });

  it("exporta CSV: cria um link de download a partir das movimentações (CEO-252)", async () => {
    ultimasMovimentacoes.mockResolvedValue(MOVS);
    // jsdom não implementa URL.createObjectURL nem o click de download — instalamos
    // stubs (a função não existe, então atribuímos antes de espionar).
    const createURL = vi.fn().mockReturnValue("blob:fake");
    const revokeURL = vi.fn();
    URL.createObjectURL = createURL;
    URL.revokeObjectURL = revokeURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    renderApp(<Movimentacoes />);
    await screen.findByText("Luvas M");

    await user.click(screen.getByRole("button", { name: /exportar csv/i }));
    expect(createURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it("mostra estado vazio quando não há movimentações", async () => {
    ultimasMovimentacoes.mockResolvedValue([]);
    renderApp(<Movimentacoes />);
    expect(await screen.findByText(/sem movimentações/i)).toBeInTheDocument();
  });
});
