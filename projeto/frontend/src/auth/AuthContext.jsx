// AuthContext.jsx — estado de autenticação da aplicação.
// Mantém o usuário logado, expõe login/logout e revalida a sessão via GET /eu.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { session } from "../api/client.js";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => session.getUser());
  // "loading" só enquanto revalidamos a sessão existente no primeiro carregamento.
  const [loading, setLoading] = useState(() => !!session.getToken());

  // Ao montar com um token salvo, confirma que ainda é válido (e atualiza o perfil).
  // (loading já inicia false quando não há token, então nada a fazer nesse caso.)
  useEffect(() => {
    if (!session.getToken()) return;
    let vivo = true;
    authApi
      .eu()
      .then((u) => { if (vivo) setUser(u); })
      .catch(() => { if (vivo) setUser(null); }) // 401 já limpa a sessão no client
      .finally(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, []);

  const login = useCallback(async (email, senha) => {
    const { usuario } = await authApi.login(email, senha);
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
