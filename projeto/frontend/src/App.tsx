import { useState, useEffect, useRef } from "react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import type { User } from "./types/user";

// limite de inatividade: x horas (x * 60 * 1000 milissegundos)
const LIMITE_INATIVIDADE = 8 * 60 * 60 * 1000; 

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const dadosSessao = sessionStorage.getItem("usuario_ceo");
    const token = sessionStorage.getItem("token_ceo");

    if (dadosSessao && token) {
      setUsuarioLogado(JSON.parse(dadosSessao));
    } else {
      handleLogout();
    }
  }, []);

  useEffect(() => {
    if (!usuarioLogado) return;

    const reiniciarTimerInatividade = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      
      timerRef.current = window.setTimeout(() => {
        alert("Sua sessão expirou por inatividade. Faça login novamente.");
        handleLogout();
      }, LIMITE_INATIVIDADE);
    };

    const eventos = ["mousemove", "keydown", "click", "scroll"];
    eventos.forEach(evento => window.addEventListener(evento, reiniciarTimerInatividade));

    reiniciarTimerInatividade();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      eventos.forEach(evento => window.removeEventListener(evento, reiniciarTimerInatividade));
    };
  }, [usuarioLogado]);

  function handleLogout() {
    sessionStorage.removeItem("usuario_ceo");
    sessionStorage.removeItem("token_ceo");
    setUsuarioLogado(null);
  }

  function handleLoginSuccess(user: User, token: string) {
    sessionStorage.setItem("usuario_ceo", JSON.stringify(user));
    sessionStorage.setItem("token_ceo", token);
    setUsuarioLogado(user);
  }

  if (!usuarioLogado) {
    return <Login onLoginSuccess={(user, token) => handleLoginSuccess(user, token)} />;
  }

  return (
    <Dashboard 
      usuario={usuarioLogado} 
      onLogout={handleLogout} 
    />
  );
}

export default App;