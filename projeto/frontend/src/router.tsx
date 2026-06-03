// Rotas da aplicação (react-router 7). Todas as telas de negócio do MVP
// (Dashboard, Estoque CEO/HO, Solicitações) estão implementadas.
import { createBrowserRouter, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { EstoqueCEO } from "@/pages/EstoqueCEO";
import { EstoqueDispensacao } from "@/pages/EstoqueDispensacao";
import { Solicitacoes } from "@/pages/Solicitacoes";

// Um ÚNICO AuthProvider envolve toda a árvore (login + rotas protegidas), para
// que a sessão criada no login seja a mesma vista pelo resto do app.
function Shell() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      // Pública.
      { path: "/login", element: <Login /> },
      // Protegidas — exigem sessão (ProtectedRoute) e usam o AppLayout.
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: "/",
                element: <Dashboard />,
              },
              {
                path: "/estoque-ceo",
                element: <EstoqueCEO />,
              },
              {
                path: "/estoque-dispensacao",
                element: <EstoqueDispensacao />,
              },
              {
                path: "/solicitacoes",
                element: <Solicitacoes />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
