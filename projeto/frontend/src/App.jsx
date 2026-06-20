import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import AppShell from "./app/AppShell.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Estoque from "./pages/Estoque.jsx";
import NovoPedido from "./pages/NovoPedido.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import PedidoDetalhe from "./pages/PedidoDetalhe.jsx";
import TrocarSenha from "./pages/TrocarSenha.jsx";
import Usuarios from "./pages/Usuarios.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Nova rota protegida, mas sem AppShell */}
          <Route path="/trocar-senha" element={
            <RequireAuth>
              <TrocarSenha />
            </RequireAuth>
          } />

          {/* Protegidas — dentro da casca da aplicação */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pedidos/novo" element={<NovoPedido />} />
            <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>

          {/* Raiz e fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
