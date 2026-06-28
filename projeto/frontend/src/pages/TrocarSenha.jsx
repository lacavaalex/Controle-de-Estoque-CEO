import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";

export default function TrocarSenha() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmar) {
      return setErro("As senhas não coincidem.");
    }
    if (senha.length < 8) {
      return setErro("A senha deve ter pelo menos 8 caracteres.");
    }

    try {
      await api.patch("/eu/senha", { novaSenha: senha });
      
      setUser({ ...user, trocarSenha: false });
      setSucesso(true);
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);

    } catch (err) {
      setErro(err.response?.data?.mensagem || "Erro ao atualizar a senha.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "var(--bg)" }}>
      <div className="login-card" style={{ width: "100%", maxWidth: "420px", margin: "20px" }}>
        <h2>Bem-vindo(a) ao C.E.O.</h2>
        <p style={{ marginBottom: 'var(--sp-5)', color: 'var(--ink-2)' }}>
          Este é o seu primeiro acesso. Por questões de segurança, você precisa definir uma senha definitiva.
        </p>
        
        {sucesso && <div className="alert alert-ok" style={{ marginBottom: "var(--sp-3)" }}>Senha atualizada com sucesso! Redirecionando...</div>}
        {erro && <div className="alert alert-danger" style={{ marginBottom: "var(--sp-3)" }}>{erro}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nova Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <div className="field">
            <label>Confirmar Senha</label>
            <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Salvar e Entrar
          </button>
        </form>
      </div>
    </div>
  );
}