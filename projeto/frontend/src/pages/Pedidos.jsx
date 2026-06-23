import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { pedidosDoSetor } from "../api/pedidos.js";
import { STATUS_PEDIDO } from "../api/constants.js";
import { PageHead, StatusPedido, TableSkeleton, ErrorState, EmptyState } from "../app/ui.jsx";

export default function Pedidos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState(location.state?.statusFiltro || "");

  const req = useFetch(
    () => (user?.setorId ? pedidosDoSetor(user.setorId, status || undefined) : Promise.resolve([])),
    [user?.setorId, status],
  );
  const pedidos = req.data ?? [];

  return (
    <div>
      <PageHead
        title="Pedidos"
        sub="Fila de pedidos do seu setor. Abra um pedido para processar item a item."
      />

      {/* Abas por status */}
      <div className="row" style={{ flexWrap: "wrap", marginBottom: "var(--sp-4)" }}>
        <button className={`btn btn-sm ${status === "" ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatus("")}>Todos</button>
        {STATUS_PEDIDO.map((s) => (
          <button key={s} className={`btn btn-sm ${status === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatus(s)}>
            <StatusPedidoLabel status={s} />
          </button>
        ))}
      </div>

      {req.loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : req.error ? (
        <ErrorState error={req.error} onRetry={req.reload} />
      ) : pedidos.length === 0 ? (
        <div className="panel">
          <EmptyState title="Nenhum pedido aqui">
            {status ? "Nenhum pedido com esse status." : "Quando houver pedidos para o seu setor, eles aparecem nesta fila."}
          </EmptyState>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Solicitante</th>
                <th className="num">Itens</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/pedidos/${p.id}`)}>
                  <td><strong>{p.id}</strong></td>
                  <td className="text-2">{p.solicitante?.nome || p.solicitante || "—"}</td>
                  <td className="num">{p.itens?.length ?? "—"}</td>
                  <td><StatusPedido status={p.status} /></td>
                  <td className="num">
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/pedidos/${p.id}`); }}>
                      Abrir →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// rótulo curto pro botão de aba
function StatusPedidoLabel({ status }) {
  const map = {
    pendente: "Pendentes",
    em_processamento: "Em proc.",
    atendido_integral: "Integral",
    atendido_parcial: "Parcial",
    nao_atendido: "Não atend.",
    aguardando_reposicao: "Aguard. rep.",
  };
  return <>{map[status] || status}</>;
}
