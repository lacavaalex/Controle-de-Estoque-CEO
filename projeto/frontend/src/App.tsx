import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import type { User } from "./types/user";

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);

  useEffect(() => {
    const dadosSessao = localStorage.getItem("usuario_ceo");
    if (dadosSessao) {
      setUsuarioLogado(JSON.parse(dadosSessao));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("usuario_ceo");
    setUsuarioLogado(null);
  }

 if (!usuarioLogado) {
    return <Login onLoginSuccess={(user) => setUsuarioLogado(user)} />;
  }

  return (
    <Dashboard 
      usuario={usuarioLogado} 
      onLogout={handleLogout} 
    />
  );
}

export default App;