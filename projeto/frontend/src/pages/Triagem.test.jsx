import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp, loginFake } from "../test/utils.jsx";
import Triagem from "./Triagem.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 3, perfil: "almoxarife", setorId: 1 }),
  logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
vi.mock("../api/rascunhos.js", () => ({
  listarRascunhosPendentes: vi.fn(),
  aprovarRascunho: vi.fn(),
  descartarRascunho: vi.fn(),
}));
vi.mock("../api/setores.js", () => ({ listarSetores: vi.fn() }));
vi.mock("../api/estoque.js", () => ({ catalogoDoSetor: vi.fn() }));

import { listarRascunhosPendentes, aprovarRascunho, descartarRascunho } from "../api/rascunhos.js";
import { listarSetores } from "../api/setores.js";
import { catalogoDoSetor } from "../api/estoque.js";

const SETORES = [
  { id: 1, nome: "HO", tipo: "almoxarifado" },
  { id: 2, nome: "CEO", tipo: "destinatario" },
];

const RASCUNHO = {
  id: 1,
  remetenteEmail: "ceo.ccs@ufpe.br",
  remetenteNome: "Ingrid e Zilma",
  confiancaGeral: 0.82,
  temAnexo: false,
  emailCru: "De: ceo.ccs@ufpe.br\nLuvas M (2 caixas).",
  criadoEm: "2026-06-20T10:00:00.000Z",
  jsonExtraido: { itens: [{ descricaoLivre: "luva M", qtd: 2, unidade: "caixa" }] },
  statusTriagem: "pendente",
};

describe("Triagem (fila de rascunhos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginFake({ id: 3, nome: "João", perfil: "almoxarife", setorId: 1 });
    listarSetores.mockResolvedValue(SETORES);
    catalogoDoSetor.mockResolvedValue([{ produtoId: 5, nome: "Luvas Descartáveis M" }]);
  });

  it("mostra estado vazio quando não há rascunhos pendentes", async () => {
    listarRascunhosPendentes.mockResolvedValue([]);
    renderApp(<Triagem />);
    expect(await screen.findByText(/nenhum rascunho pendente/i)).toBeInTheDocument();
  });

  it("lista os rascunhos pendentes com remetente e confiança", async () => {
    listarRascunhosPendentes.mockResolvedValue([RASCUNHO]);
    renderApp(<Triagem />);
    expect(await screen.findByText("Ingrid e Zilma")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
  });

  it("sinaliza confiança baixa (<0.6) com aviso", async () => {
    listarRascunhosPendentes.mockResolvedValue([{ ...RASCUNHO, confiancaGeral: 0.4 }]);
    renderApp(<Triagem />);
    expect(await screen.findByText(/40% ⚠/)).toBeInTheDocument();
  });

  it("abre o painel de revisão e exige escolher o setor de origem antes de aprovar", async () => {
    listarRascunhosPendentes.mockResolvedValue([RASCUNHO]);
    const user = userEvent.setup();
    renderApp(<Triagem />);
    await screen.findByText("Ingrid e Zilma");

    await user.click(screen.getByRole("button", { name: /abrir/i }));
    // painel aberto: aparece o botão de aprovar, desabilitado (sem origem ainda)
    const aprovar = await screen.findByRole("button", { name: /aprovar/i });
    expect(aprovar).toBeDisabled();

    // escolhe a origem (CEO) → habilita aprovar
    await user.selectOptions(screen.getByLabelText(/setor solicitante/i), "2");
    expect(screen.getByRole("button", { name: /aprovar/i })).toBeEnabled();
  });

  it("aprova: chama aprovarRascunho com origem, destino e itens (XOR)", async () => {
    listarRascunhosPendentes.mockResolvedValue([RASCUNHO]);
    aprovarRascunho.mockResolvedValue({ id: "PED-010" });
    const user = userEvent.setup();
    renderApp(<Triagem />);
    await screen.findByText("Ingrid e Zilma");
    await user.click(screen.getByRole("button", { name: /abrir/i }));
    await screen.findByRole("button", { name: /aprovar/i });

    await user.selectOptions(screen.getByLabelText(/setor solicitante/i), "2");
    await user.click(screen.getByRole("button", { name: /aprovar/i }));

    expect(aprovarRascunho).toHaveBeenCalledTimes(1);
    const [id, payload] = aprovarRascunho.mock.calls[0];
    expect(id).toBe(1);
    expect(payload.setorOrigemId).toBe(2);
    expect(payload.setorDestinoId).toBe(1);
    expect(payload.itens).toHaveLength(1);
    // item pré-preenchido da extração era linha livre → mantém descricaoLivre, sem produtoId
    expect(payload.itens[0]).toMatchObject({ descricaoLivre: "luva M", qtdSolicitada: 2, unidade: "caixa" });
    expect(payload.itens[0].produtoId).toBeUndefined();
  });

  it("descarta: chama descartarRascunho após confirmação", async () => {
    listarRascunhosPendentes.mockResolvedValue([RASCUNHO]);
    descartarRascunho.mockResolvedValue(null);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderApp(<Triagem />);
    await screen.findByText("Ingrid e Zilma");
    await user.click(screen.getByRole("button", { name: /abrir/i }));

    await user.click(await screen.findByRole("button", { name: /descartar/i }));
    expect(descartarRascunho).toHaveBeenCalledWith(1);
  });
});
