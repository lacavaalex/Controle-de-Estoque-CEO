import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";

function ConteudoApp() {
  const { usuarioLogado, carregandoSessao, logout } = useAuth();

  if (carregandoSessao) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Carregando...</div>;
  }

  if (!usuarioLogado) {
    return <Login />;
  }

  return (
    <Dashboard 
      usuario={usuarioLogado} 
      onLogout={logout} 
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConteudoApp />
    </AuthProvider>
  );
}