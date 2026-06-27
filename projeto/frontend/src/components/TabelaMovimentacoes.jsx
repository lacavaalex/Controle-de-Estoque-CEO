// TabelaMovimentacoes — tabela do log de movimentações (CEO-252).
// Reusada no painel do Dashboard e na página /movimentacoes.
import { ROTULO_TIPO, CLASSE_TIPO, formatarDataHora } from "../app/movimentacoes.js";
import { EmptyState } from "../app/ui.jsx";

function BadgeTipo({ tipo }) {
  return <span className={`badge ${CLASSE_TIPO[tipo] || "mv-ajuste"}`}>{ROTULO_TIPO[tipo] || tipo}</span>;
}

export default function TabelaMovimentacoes({ movimentacoes }) {
  if (!movimentacoes?.length) {
    return (
      <div className="panel">
        <EmptyState title="Sem movimentações">
          Nenhuma movimentação registrada para os filtros atuais.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Quando</th>
            <th>Tipo</th>
            <th>Produto</th>
            <th className="num">Qtd.</th>
            <th>Origem → Destino</th>
            <th>Retirado por</th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((m) => (
            <tr key={m.id}>
              <td className="text-2">{formatarDataHora(m.data)}</td>
              <td><BadgeTipo tipo={m.tipo} /></td>
              <td>{m.produtoNome}</td>
              <td className="num">{m.quantidade}</td>
              <td className="text-2">
                {m.setorOrigemNome}
                {m.setorDestinoNome ? ` → ${m.setorDestinoNome}` : ""}
              </td>
              <td className="text-2">{m.retiradoPor || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
