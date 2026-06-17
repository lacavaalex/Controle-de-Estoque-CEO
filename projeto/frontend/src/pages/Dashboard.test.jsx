import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderApp, loginFake } from "../test/utils.jsx";
import Dashboard from "./Dashboard.jsx";

vi.mock("../api/auth.js", () => ({
  login: vi.fn(), eu: vi.fn().mockResolvedValue({ id: 7, perfil: "gestor", setorId: 1 }),
  logout: vi.fn(), provisionarUsuario: vi.fn(),
}));
vi.mock("../api/dashboard.js", () => ({ dashboard: vi.fn() }));
import { dashboard } from "../api/dashboard.js";

describe("Dashboard", () => {
  beforeEach(() => { vi.clearAllMocks(); loginFake({ id: 7, nome: "Ana", perfil: "gestor", setorId: 1 }); });

  it("mostra os KPIs quando a API responde", async () => {
    dashboard.mockResolvedValue({
      totalProdutos: 120, produtosCriticos: 5, lotesVencendo30: 3, lotesVencendo60: 7,
      pedidosPendentes: 2, demandaRepresada: [{ produtoId: 9, nome: "Luva", qtdSolicitadaTotal: 40, numPedidos: 3 }],
    });
    renderApp(<Dashboard />);
    expect(await screen.findByText("120")).toBeInTheDocument();
    expect(screen.getByText("Produtos críticos")).toBeInTheDocument();
    expect(screen.getByText("Luva")).toBeInTheDocument();
  });

  it("quando o endpoint não existe (404), mostra aviso honesto em vez de números falsos", async () => {
    const { ApiError } = await import("../api/client.js");
    dashboard.mockRejectedValue(new ApiError("Not Found", 404));
    renderApp(<Dashboard />);
    expect(await screen.findByText(/ainda está sendo entregue no backend/i)).toBeInTheDocument();
  });
});
