import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Cadastro } from "./components/Cadastro";
import type { User } from "./types/user";

function App() {
  const [sessaoAtiva, setSessaoAtiva] = useState<boolean>(false);

  useEffect(() => {
    const conferirSessao = () => {
      const u = localStorage.getItem("usuario_ceo");
      setSessaoAtiva(!!u);
    };

    conferirSessao();
    window.addEventListener("storage", conferirSessao);
    return () => window.removeEventListener("storage", conferirSessao);
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "10px" }}>
      {!sessaoAtiva ? (
        <Login />
      ) : (
        <div>
          <div style={{ backgroundColor: "#f8f9fa", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd" }}>
            <h2>Painel de Controle - C.E.O. UFPE</h2>
            <button 
              onClick={() => {
                localStorage.removeItem("usuario_ceo");
                window.location.reload();
              }}
              style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Sair do Sistema
            </button>
          </div>
          
          <Cadastro />
        </div>
      )}
    </div>
  );
}

export default App;