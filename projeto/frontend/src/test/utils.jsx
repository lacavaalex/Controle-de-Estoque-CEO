// utils.jsx — helpers de teste (render com Router + AuthProvider e sessão fake).
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import { session } from "../api/client.js";

// Loga um usuário fake no localStorage antes de montar.
export function loginFake(usuario = { id: 7, nome: "Ana Costa", perfil: "gestor", setorId: 1, email: "ana@ufpe.br" }) {
  session.set("token-fake", usuario);
  return usuario;
}

// Renderiza um elemento dentro de Router + AuthProvider.
// `path`/`route` permitem testar rotas com parâmetros (ex.: /pedidos/:id).
export function renderApp(element, { route = "/", path } = {}) {
  if (path) {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={element} />
            <Route path="*" element={<div>__rota__: <span data-testid="loc" /></div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>{element}</MemoryRouter>
    </AuthProvider>,
  );
}
