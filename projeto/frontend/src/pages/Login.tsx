// Tela de login (EP01). Funcional: chama POST /login via AuthContext.
import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";

interface LocationState {
  from?: { pathname: string };
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Falha ao entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
      >
        <h1 className="text-xl font-bold text-gray-900">Controle de Estoque</h1>
        <p className="mb-6 text-sm text-gray-500">CEO · UFPE — Odontologia</p>

        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
          E-mail institucional
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
          placeholder="nome@ufpe.br"
        />

        <label className="block text-sm font-medium text-gray-700" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
        />

        {erro && <p className="mt-4 text-sm text-status-critico">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
