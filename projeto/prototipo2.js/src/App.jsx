import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from '@/router/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import EstoqueDispensacao from '@/pages/EstoqueDispensacao'
import EstoqueCEO from '@/pages/EstoqueCEO'
import Solicitacoes from '@/pages/Solicitacoes'

function RootRedirect() {
  const { usuario } = useAuth()
  return <Navigate to={usuario ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/estoque-dispensacao"
            element={
              <ProtectedRoute allowedRoles={['gestao', 'almoxarife']}>
                <EstoqueDispensacao />
              </ProtectedRoute>
            }
          />
          <Route path="/estoque-ceo" element={<EstoqueCEO />} />
          <Route path="/solicitacoes" element={<Solicitacoes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
