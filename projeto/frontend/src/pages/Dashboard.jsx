import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { dashboard } from "../api/dashboard.js";
import { ApiError } from "../api/client.js";
import { ROTULO_PERFIL } from "../app/nav.js";
import { PageHead, ErrorState } from "../app/ui.jsx";
import "../styles/Dashboard.css";

function Kpi({ label, value, tone, to, hint }) {
  const body = (
    <div className={`kpi kpi-${tone || "neutral"}`}>
      <div className="kpi-value num">{value}</div>
      <div className="kpi-label">{label}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} className="kpi-link">{body}</Link> : body;
}

export default function Dashboard() {
  const { user } = useAuth();
  const req = useFetch(
    () => (user?.setorId ? dashboard(user.setorId) : Promise.resolve(null)),
    [user?.setorId],
  );

  // Endpoint do dashboard é do Pacote 2 (). Se ainda não existir, mostramos
  // um aviso honesto em vez de fingir números.
  const indisponivel = req.error instanceof ApiError && (req.error.status === 404 || req.error.status === 501);
  const d = req.data || {};

  return (
    <div>
      <PageHead
        title="Dashboard"
        sub={`Visão do setor — ${ROTULO_PERFIL[user?.perfil] || user?.perfil}.`}
      />

      {req.loading ? (
        <div className="grid-kpi">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi"><div className="skeleton" style={{ height: 34, width: "50%" }} /><div className="skeleton" style={{ height: 12, width: "70%", marginTop: 10 }} /></div>
          ))}
        </div>
      ) : indisponivel ? (
        <div className="alert alert-info">
          O painel de indicadores (KPIs) ainda está sendo entregue no backend (Pacote 2). Assim que a rota
          <code> GET /dashboard </code> entrar, os números aparecem aqui automaticamente — sem mudança no front.
        </div>
      ) : req.error ? (
        <ErrorState error={req.error} onRetry={req.reload} />
      ) : (
        <>
          <div className="grid-kpi">
            <Kpi label="Produtos cadastrados" value={d.totalProdutos ?? 0} tone="neutral" to="/estoque" />
            <Kpi label="Produtos críticos" value={d.produtosCriticos ?? 0} tone="danger" to="/estoque" hint="abaixo do mínimo" />
            <Kpi label="Lotes vencendo (30d)" value={d.lotesVencendo30 ?? 0} tone="warn" hint={`${d.lotesVencendo60 ?? 0} em 60 dias`} />
            <Kpi label="Pedidos pendentes" value={d.pedidosPendentes ?? 0} tone="info" to="/pedidos" />
          </div>

          {/* Demanda represada */}
          <h3 style={{ margin: "var(--sp-6) 0 var(--sp-3)" }}>Demanda represada</h3>
          {!d.demandaRepresada?.length ? (
            <div className="panel"><div className="empty"><h4>Sem demanda represada</h4><p>Nenhum item aguardando reposição no momento.</p></div></div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>Produto</th><th className="num">Qtd. solicitada</th><th className="num">Nº pedidos</th></tr>
                </thead>
                <tbody>
                  {d.demandaRepresada.map((r) => (
                    <tr key={r.produtoId}>
                      <td>{r.nome}</td>
                      <td className="num">{r.qtdSolicitadaTotal}</td>
                      <td className="num">{r.numPedidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
