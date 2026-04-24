import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ceo_usuario')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  function login(user) {
    setUsuario(user)
    sessionStorage.setItem('ceo_usuario', JSON.stringify(user))
  }

  function logout() {
    setUsuario(null)
    sessionStorage.removeItem('ceo_usuario')
  }

  function isRole(role) {
    return usuario?.role === role
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
