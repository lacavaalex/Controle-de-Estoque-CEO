// Rotas da aplicação (react-router 7). O esqueleto já reflete as telas das
// stories do EP03/EP04; as de negócio são placeholders até a implementação.
import { createBrowserRouter, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { Login } from "@/pages/Login";
import { Placeholder } from "@/pages/Placeholder";
import { EstoqueCEO } from "@/pages/EstoqueCEO";

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
                element: (
                  <Placeholder
                    titulo="Dashboard"
                    descricao="Visão geral do estoque e das solicitações."
                  />
                ),
              },
              {
                path: "/estoque-ceo",
                element: <EstoqueCEO />,
              },
              {
                path: "/estoque-dispensacao",
                element: (
                  <Placeholder
                    titulo="Estoque da Dispensação (HO)"
                    descricao="Catálogo e estoque do almoxarifado central, com detalhe de lote."
                    story="EP02"
                  />
                ),
              },
              {
                path: "/solicitacoes",
                element: (
                  <Placeholder
                    titulo="Solicitações / Pedidos"
                    descricao="Criar pedidos multi-item e acompanhar o processamento."
                    story="EP04"
                  />
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
