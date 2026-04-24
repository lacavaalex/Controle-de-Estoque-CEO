import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(usuario.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
