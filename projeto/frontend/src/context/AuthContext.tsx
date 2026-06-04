// =============================================================================
// AuthContext — sessão do usuário no front (EP01).
// Guarda token (localStorage via api/client) + usuário, e expõe login/logout.
// Na montagem, se há token salvo, valida com GET /eu para reidratar a sessão.
// =============================================================================
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/api/auth";
import { getToken, setToken } from "@/api/client";
import type { Identidade, Usuario } from "@/types/domain";

interface AuthState {
  usuario: Usuario | null;
  identidade: Identidade | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Reidrata a sessão a partir de um token salvo (refresh da página).
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCarregando(false);
      return;
    }
    authApi
      .eu()
      .then(({ identidade }) => setIdentidade(identidade))
      .catch(() => {
        // Token inválido/expirado: limpa.
        setToken(null);
        setIdentidade(null);
        setUsuario(null);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function login(email: string, senha: string): Promise<void> {
    const { token, usuario } = await authApi.login(email, senha);
    setToken(token);
    // Reidrata a identidade (perfil/setor) via /eu. Se essa 2ª chamada falhar,
    // desfaz o token para não deixar sessão pela metade (token sem identidade).
    try {
      setUsuario(usuario);
      const { identidade } = await authApi.eu();
      setIdentidade(identidade);
    } catch (err) {
      setToken(null);
      setUsuario(null);
      setIdentidade(null);
      throw err;
    }
  }

  function logout(): void {
    setToken(null);
    setUsuario(null);
    setIdentidade(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, identidade, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
