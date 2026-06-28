import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { obterPedido, expedirItem } from "../api/pedidos.js";
import { PERFIL } from "../api/constants.js";
import { ApiError } from "../api/client.js";
import { PageHead, StatusPedido, ErrorState, EmptyState } from "../app/ui.jsx";
import "../styles/Pedido.css";

export default function PedidoDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recemCriado = location.state?.criado;

  const req = useFetch(() => obterPedido(id), [id]);
  const pedido = req.data;

  // almoxarife e gestor (do HO) processam; solicitante só visualiza.
  const podeProcessar = user?.perfil === PERFIL.ALMOXARIFE || user?.perfil === PERFIL.GESTOR;

  // estado por item: expedindo / erro / "acabou de mexer" (highlight)
  const [itemState, setItemState] = useState({}); // { [itemId]: { loading, erro, justMoved } }
  // CEO-267 — nome de quem retira fisicamente o material (obrigatório p/ expedir).
  const [retiradoPor, setRetiradoPor] = useState("");
  const retiranteOk = retiradoPor.trim().length >= 2;

  function setIS(itemId, patch) {
    setItemState((s) => ({ ...s, [itemId]: { ...s[itemId], ...patch } }));
  }

  async function expedir(itemId) {
    setIS(itemId, { loading: true, erro: null });
    try {
      const res = await expedirItem(id, itemId, retiradoPor.trim());
      // Atualiza o item no pedido e o status do pedido com a resposta.
      req.setData((prev) => {
        if (!prev) return prev;
        const itens = prev.itens.map((it) => (String(it.id) === String(itemId) ? { ...it, ...res.item } : it));
        return { ...prev, itens, status: res.statusPedido ?? prev.status };
      });
      setIS(itemId, { loading: false, justMoved: true, movimentacoes: res.movimentacoes });
      // remove o highlight depois de um instante
      setTimeout(() => setIS(itemId, { justMoved: false }), 1800);
    } catch (err) {
      setIS(itemId, { loading: false, erro: err instanceof ApiError ? err.message : "Falha ao expedir." });
    }
  }

  if (req.loading) {
    return (
      <div>
        <PageHead title="Pedido" />
        <div className="panel" style={{ padding: "var(--sp-5)" }}>
          <div className="skeleton" style={{ height: 18, width: 220, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      </div>
    );
  }
  if (req.error) {
    return (
      <div>
        <PageHead title="Pedido" actions={<button className="btn btn-secondary btn-sm" onClick={() => navigate("/pedidos")}>← Voltar</button>} />
        <ErrorState error={req.error} onRetry={req.reload} />
      </div>
    );
  }
  if (!pedido) return null;

  const nomeItem = (it) => it.produtoNome || it.nome || it.descricaoLivre || (it.produtoId ? `Produto #${it.produtoId}` : "Item");

  return (
    <div>
      <PageHead
        title={`Pedido ${pedido.id}`}
        sub={pedido.justificativa}
        actions={<button className="btn btn-secondary btn-sm" onClick={() => navigate("/pedidos")}>← Voltar à fila</button>}
      />

      {recemCriado && <div className="alert alert-ok" style={{ marginBottom: "var(--sp-4)" }}>Pedido criado com sucesso.</div>}

      {/* Resumo */}
      <div className="panel pedido-resumo" style={{ marginBottom: "var(--sp-5)" }}>
        <div><span className="muted">Situação</span><div style={{ marginTop: 4 }}><StatusPedido status={pedido.status} /></div></div>
        <div><span className="muted">Solicitante</span><div style={{ marginTop: 4 }}>{pedido.solicitante?.nome || pedido.solicitante || "—"}</div></div>
        <div><span className="muted">Origem → Destino</span><div style={{ marginTop: 4 }}>#{pedido.setorOrigemId} → #{pedido.setorDestinoId}</div></div>
        {pedido.dataCriacao && <div><span className="muted">Criado em</span><div style={{ marginTop: 4 }}>{new Date(pedido.dataCriacao).toLocaleString("pt-BR")}</div></div>}
      </div>

      <h3 style={{ marginBottom: "var(--sp-3)" }}>Itens</h3>

      {/* CEO-267 — identificação de quem retira o material. Só pessoas
          autorizadas podem retirar; o nome fica gravado na saída (auditoria). */}
      {podeProcessar && (
        <div className="panel" style={{ padding: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
          <label style={{ margin: 0, display: "block" }}>
            Retirado por <span className="muted">(quem está levando o material)</span>
            <input
              type="text"
              value={retiradoPor}
              onChange={(e) => setRetiradoPor(e.target.value)}
              placeholder="Nome de quem retira (professor / pessoa autorizada)"
              style={{ display: "block", width: "100%", maxWidth: 420, marginTop: 4 }}
            />
          </label>
          {!retiranteOk && (
            <p className="muted" style={{ margin: "var(--sp-2) 0 0", fontSize: "var(--fs-13)" }}>
              Informe quem está retirando para liberar a expedição.
            </p>
          )}
        </div>
      )}

      {!pedido.itens?.length ? (
        <div className="panel"><EmptyState title="Pedido sem itens" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Solicitado</th>
                <th className="num">Expedido</th>
                <th>Situação</th>
                {podeProcessar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((it) => {
                const st = itemState[it.id] || {};
                const finalizado = it.statusItem === "atendido_integral";
                const livre = !it.produtoId && it.descricaoLivre; // linha livre não expede direto
                return (
                  <tr key={it.id} className={st.justMoved ? "row-moved" : ""}>
                    <td>
                      {nomeItem(it)}
                      {livre && <span className="badge st-indisponivel" style={{ marginLeft: 8 }}>linha livre</span>}
                      {st.erro && <div className="item-erro">{st.erro}</div>}
                      {st.justMoved && st.movimentacoes && (
                        <div className="item-mov">↑ estoque CEO atualizado · {st.movimentacoes.join(", ")}</div>
                      )}
                    </td>
                    <td className="num">{it.qtdSolicitada} {it.unidade}</td>
                    <td className="num">{it.qtdExpedida ?? 0}</td>
                    <td><StatusPedido status={it.statusItem} /></td>
                    {podeProcessar && (
                      <td className="num">
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={st.loading || finalizado || livre || !retiranteOk}
                          title={livre ? "Linha livre precisa virar produto antes de expedir" : finalizado ? "Item já atendido" : !retiranteOk ? "Informe quem está retirando o material" : "Expedir por FEFO"}
                          onClick={() => expedir(it.id)}
                        >
                          {st.loading ? "Expedindo…" : finalizado ? "Atendido" : "Expedir"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {podeProcessar && (
        <p className="muted" style={{ marginTop: "var(--sp-3)", fontSize: "var(--fs-13)" }}>
          A expedição usa <strong>FEFO</strong> (vence primeiro, sai primeiro) automaticamente: baixa o lote do HO e alimenta o estoque do CEO.
        </p>
      )}
    </div>
  );
}
