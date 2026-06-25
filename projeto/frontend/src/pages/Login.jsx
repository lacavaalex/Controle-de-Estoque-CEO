import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { ApiError } from "../api/client.js";
import "../styles/App.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const destino = location.state?.from?.pathname || "/dashboard";

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await login(email.trim(), senha);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <img
          src="/brasao-ufpe.png" alt="Brasão da UFPE" className="brand-crest"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="brand-mark">Estoque HO <span>· UFPE</span></div>
        <p className="brand-tagline">
          Controle de estoque do Hospital Odontológico — pedidos, expedição por
          validade (FEFO) e visão de estoque em um só lugar.
        </p>
        <div className="brand-foot">Universidade Federal de Pernambuco</div>
      </section>

      <section className="login-form-col">
        <div className="login-card">
          <div className="login-head">
            <h1>Entrar</h1>
            <p>Acesse com seu e-mail institucional.</p>
          </div>

          {erro && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: "var(--sp-4)" }}>
              {erro}
            </div>
          )}

          <form onSubmit={entrar} noValidate>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email" type="email" autoComplete="username"
                placeholder="nome@ufpe.br"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha" type="password" autoComplete="current-password"
                placeholder="Sua senha"
                value={senha} onChange={(e) => setSenha(e.target.value)} required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar no sistema"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;
