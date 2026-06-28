// Movimentacoes — log completo de movimentações, filtrável (CEO-252).
// Aprofunda o painel do Dashboard: permite escolher setor (gestão), tipo e
// quantos registros carregar.
import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { ultimasMovimentacoes } from "../api/dashboard.js";
import { listarSetores } from "../api/setores.js";
import { ApiError } from "../api/client.js";
import { PERFIL } from "../api/constants.js";
import { PageHead, ErrorState } from "../app/ui.jsx";
import TabelaMovimentacoes from "../components/TabelaMovimentacoes.jsx";
import { TIPOS_MOVIMENTACAO, ROTULO_TIPO, movimentacoesParaCsv } from "../app/movimentacoes.js";

const LIMITES = [25, 50, 100];

// Dispara o download de um arquivo CSV no navegador (sem libs).
function baixarCsv(texto, nomeArquivo) {
  const blob = new Blob([texto], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Movimentacoes() {
  const { user } = useAuth();
  // Gestão pode inspecionar outros setores; demais perfis ficam no próprio.
  const ehGestao = user?.perfil === PERFIL.GESTOR || user?.perfil === PERFIL.ALMOXARIFE;

  const [setorId, setSetorId] = useState(user?.setorId ?? null);
  const [tipo, setTipo] = useState("");
  const [limite, setLimite] = useState(50);
  // Filtro por intervalo de datas (CEO-252) — YYYY-MM-DD, ambos opcionais.
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const setoresReq = useFetch(() => (ehGestao ? listarSetores() : Promise.resolve([])), [ehGestao]);
  const setores = useMemo(() => setoresReq.data ?? [], [setoresReq.data]);

  const movReq = useFetch(
    () =>
      setorId
        ? ultimasMovimentacoes(setorId, {
            limite,
            tipo: tipo || undefined,
            dataInicio: dataInicio || undefined,
            dataFim: dataFim || undefined,
          })
        : Promise.resolve([]),
    [setorId, tipo, limite, dataInicio, dataFim],
  );
  const indisponivel = movReq.error instanceof ApiError && (movReq.error.status === 404 || movReq.error.status === 501);

  const dados = movReq.data ?? [];
  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(movimentacoesParaCsv(dados), `movimentacoes-${hoje}.csv`);
  }

  return (
    <div>
      <PageHead
        title="Movimentações"
        sub="Log de entradas, saídas, ajustes, consumo e segregação."
      />

      <div className="row" style={{ flexWrap: "wrap", marginBottom: "var(--sp-3)" }}>
        {ehGestao && (
          <label style={{ margin: 0 }}>
            Setor
            <select
              value={setorId ?? ""}
              onChange={(e) => setSetorId(e.target.value ? Number(e.target.value) : null)}
              style={{ minWidth: 180 }}
            >
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </label>
        )}
        <label style={{ margin: 0 }}>
          Mostrar
          <select value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
            {LIMITES.map((n) => (
              <option key={n} value={n}>{n} registros</option>
            ))}
          </select>
        </label>
        <label style={{ margin: 0 }}>
          De
          <input type="date" value={dataInicio} max={dataFim || undefined} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label style={{ margin: 0 }}>
          Até
          <input type="date" value={dataFim} min={dataInicio || undefined} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        {(dataInicio || dataFim) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-end" }}
            onClick={() => { setDataInicio(""); setDataFim(""); }}
            title="Limpar o filtro de datas"
          >
            Limpar datas
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: "auto", alignSelf: "flex-end" }}
          onClick={exportarCsv}
          disabled={!dados.length}
          title={dados.length ? "Baixar o log atual em CSV" : "Sem movimentações para exportar"}
        >
          Exportar CSV
        </button>
      </div>

      <div className="chips">
        <button className={`chip ${tipo === "" ? "chip-on" : ""}`} onClick={() => setTipo("")}>
          Todas
        </button>
        {TIPOS_MOVIMENTACAO.map((t) => (
          <button key={t} className={`chip ${tipo === t ? "chip-on" : ""}`} onClick={() => setTipo(t)}>
            {ROTULO_TIPO[t]}
          </button>
        ))}
      </div>

      {movReq.loading ? (
        <div className="panel"><div className="skeleton" style={{ height: 200 }} /></div>
      ) : indisponivel ? (
        <div className="alert alert-info">
          O log de movimentações ainda está sendo entregue no backend. Assim que a rota
          <code> GET /dashboard/movimentacoes </code> entrar, ele aparece aqui automaticamente.
        </div>
      ) : movReq.error ? (
        <ErrorState error={movReq.error} onRetry={movReq.reload} />
      ) : (
        <TabelaMovimentacoes movimentacoes={movReq.data} />
      )}
    </div>
  );
}
