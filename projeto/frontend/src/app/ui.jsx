// ui.jsx — pequenos componentes de UI compartilhados (estados + badges).
import { ApiError } from "../api/client.js";
import { STATUS_CLASS, STATUS_PEDIDO_CLASS, ROTULO_STATUS } from "../api/constants.js";

// Cabeçalho de página padrão.
export function PageHead({ title, sub, actions }) {
  return (
    <div className="page-head row-between">
      <div>
        <h1>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

// Badge de status de estoque (cor + rótulo, nunca cor sozinha).
export function StatusEstoque({ status }) {
  const cls = STATUS_CLASS[status] || "st-indisponivel";
  return (
    <span className={`badge ${cls}`}>
      <span className="dot" style={{ background: "currentColor" }} />
      {status}
    </span>
  );
}

// Badge de status de pedido/item.
export function StatusPedido({ status }) {
  const cls = STATUS_PEDIDO_CLASS[status] || "st-indisponivel";
  return <span className={`badge ${cls}`}>{ROTULO_STATUS[status] || status}</span>;
}

// Linhas de esqueleto para carregamento de tabela.
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><div className="skeleton" style={{ height: 14, width: c === 0 ? "70%" : "45%" }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Estado de erro com botão de tentar de novo.
export function ErrorState({ error, onRetry }) {
  const msg = error instanceof ApiError ? error.message : (error?.message || "Algo deu errado.");
  return (
    <div className="alert alert-danger" role="alert">
      <div className="row-between">
        <span>{msg}</span>
        {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Tentar de novo</button>}
      </div>
    </div>
  );
}

// Estado vazio que ensina a próxima ação.
export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h4>{title}</h4>
      {children && <p>{children}</p>}
    </div>
  );
}
