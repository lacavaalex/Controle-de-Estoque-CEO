// Triagem.jsx — human-in-the-loop do Agente de Email (EP08 / CEO-276).
// O almoxarife/gestor HO revisa os rascunhos que o agente extraiu de emails e
// aprova (vira pedido) ou descarta. Espelha o padrão de itens do Novo Pedido:
// catálogo (produtoId) OU linha livre (descricaoLivre) — XOR INV07.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../app/useFetch.js";
import { listarRascunhosPendentes, aprovarRascunho, descartarRascunho } from "../api/rascunhos.js";
import { listarSetores } from "../api/setores.js";
import { catalogoDoSetor } from "../api/estoque.js";
import { UNIDADES } from "../api/constants.js";
import { ApiError } from "../api/client.js";
import { PageHead, TableSkeleton, ErrorState, EmptyState } from "../app/ui.jsx";

let _uid = 0;
const itemVazio = () => ({
  key: ++_uid,
  modo: "catalogo", // "catalogo" | "livre"
  produtoId: "",
  descricaoLivre: "",
  qtdSolicitada: 1,
  unidade: "unidade",
});

// Converte o jsonExtraido do agente (shape não-garantido) em linhas editáveis.
// Defensivo: campos podem faltar/variar; o almoxarife corrige antes de aprovar.
function itensDoRascunho(rascunho) {
  const extr = rascunho?.jsonExtraido;
  const lista = Array.isArray(extr?.itens) ? extr.itens : [];
  if (lista.length === 0) return [itemVazio()];
  return lista.map((it) => {
    const produtoId = it.produtoId ?? it.produtoIdPalpite ?? "";
    const temProduto = produtoId !== "" && produtoId != null;
    // Não forçamos `|| 1`: uma qtd 0/ausente/inválida extraída do email deve ficar
    // vazia para o almoxarife corrigir (itensValidos barra qtd <= 0), em vez de
    // virar 1 silenciosamente e ser aprovada com o valor errado.
    const qtdExtraida = Number(it.qtdSolicitada ?? it.qtd);
    return {
      key: ++_uid,
      modo: temProduto ? "catalogo" : "livre",
      produtoId: temProduto ? String(produtoId) : "",
      descricaoLivre: temProduto ? "" : String(it.descricaoLivre ?? it.descricao ?? ""),
      qtdSolicitada: Number.isInteger(qtdExtraida) && qtdExtraida > 0 ? qtdExtraida : "",
      unidade: UNIDADES.includes(it.unidade) ? it.unidade : "unidade",
    };
  });
}

export default function Triagem() {
  const navigate = useNavigate();
  const listaReq = useFetch(() => listarRascunhosPendentes(), []);
  const rascunhos = useMemo(() => listaReq.data ?? [], [listaReq.data]);
  const [abertoId, setAbertoId] = useState(null);

  const aberto = useMemo(
    () => rascunhos.find((r) => r.id === abertoId) ?? null,
    [rascunhos, abertoId],
  );

  return (
    <div>
      <PageHead
        title="Triagem de rascunhos"
        sub="Solicitações que chegaram por email. Revise e aprove (vira pedido) ou descarte."
      />

      {listaReq.loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : listaReq.error ? (
        <ErrorState error={listaReq.error} onRetry={listaReq.reload} />
      ) : rascunhos.length === 0 ? (
        <div className="panel">
          <EmptyState title="Nenhum rascunho pendente">
            Quando o agente extrair uma solicitação de email, ela aparece aqui para revisão.
          </EmptyState>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Remetente</th>
                <th>Recebido</th>
                <th>Confiança</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rascunhos.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.remetenteNome || r.remetenteEmail || "—"}</strong>
                    {r.temAnexo && <span className="badge st-vencendo" style={{ marginLeft: 8 }}>tem anexo</span>}
                    {r.remetenteEmail && r.remetenteNome && (
                      <div className="muted" style={{ fontSize: "var(--fs-12)" }}>{r.remetenteEmail}</div>
                    )}
                  </td>
                  <td className="text-2">{formatarData(r.criadoEm)}</td>
                  <td><Confianca valor={r.confiancaGeral} /></td>
                  <td className="num">
                    <button className="btn btn-ghost btn-sm" onClick={() => setAbertoId(r.id === abertoId ? null : r.id)}>
                      {r.id === abertoId ? "Fechar" : "Abrir →"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aberto && (
        <PainelRevisao
          key={aberto.id}
          rascunho={aberto}
          onResolvido={(destino) => {
            setAbertoId(null);
            listaReq.reload();
            if (destino) navigate(destino, { state: { criado: true } });
          }}
          onCancelar={() => setAbertoId(null)}
        />
      )}
    </div>
  );
}

// ─── Painel de revisão de um rascunho ────────────────────────────────────────
function PainelRevisao({ rascunho, onResolvido, onCancelar }) {
  const setoresReq = useFetch(() => listarSetores(), []);
  const setores = useMemo(() => setoresReq.data ?? [], [setoresReq.data]);
  const almoxarifados = useMemo(() => setores.filter((s) => s.tipo === "almoxarifado"), [setores]);
  // Destino = almoxarifado HO (primeiro almoxarifado, como no Novo Pedido).
  const destinoId = almoxarifados[0] ? String(almoxarifados[0].id) : "";

  const [origemId, setOrigemId] = useState(""); // OBRIGATÓRIO — almoxarife escolhe (ADR-0004)
  const [justificativa, setJustificativa] = useState(justificativaInicial(rascunho));
  const [itens, setItens] = useState(() => itensDoRascunho(rascunho));
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Catálogo do setor de origem escolhido (popula o dropdown de produto).
  const catReq = useFetch(() => (origemId ? catalogoDoSetor(origemId) : Promise.resolve([])), [origemId]);
  const catalogo = catReq.data ?? [];

  function atualizarItem(key, patch) {
    setItens((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function removerItem(key) {
    setItens((arr) => (arr.length === 1 ? arr : arr.filter((it) => it.key !== key)));
  }

  const justOk = justificativa.trim().length >= 10;
  // destinoOk: bloqueia aprovar enquanto não há almoxarifado destino carregado —
  // senão o payload mandaria setorDestinoId 0 (Number("")) e o backend rejeitaria.
  const destinoOk = !!destinoId;
  const origemOk = !!origemId && origemId !== destinoId;
  const itensValidos = useMemo(
    () =>
      itens.every((it) => {
        const qtd = Number(it.qtdSolicitada) > 0;
        const identificado = it.modo === "catalogo" ? !!it.produtoId : it.descricaoLivre.trim().length > 0;
        return qtd && identificado && it.unidade;
      }),
    [itens],
  );
  const podeAprovar = origemOk && destinoOk && justOk && itensValidos && !enviando;

  async function aprovar() {
    setErro("");
    if (!podeAprovar) return;
    setEnviando(true);
    try {
      const payload = {
        setorOrigemId: Number(origemId),
        setorDestinoId: Number(destinoId),
        justificativa: justificativa.trim(),
        // XOR INV07 — produtoId OU descricaoLivre, nunca os dois.
        itens: itens.map((it) =>
          it.modo === "catalogo"
            ? { produtoId: Number(it.produtoId), qtdSolicitada: Number(it.qtdSolicitada), unidade: it.unidade }
            : { descricaoLivre: it.descricaoLivre.trim(), qtdSolicitada: Number(it.qtdSolicitada), unidade: it.unidade },
        ),
      };
      const pedido = await aprovarRascunho(rascunho.id, payload);
      onResolvido(`/pedidos/${pedido.id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível aprovar o rascunho.");
      setEnviando(false);
    }
  }

  async function descartar() {
    setErro("");
    if (!confirm("Descartar este rascunho? Ele não vira pedido.")) return;
    setEnviando(true);
    try {
      await descartarRascunho(rascunho.id);
      onResolvido(null);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível descartar o rascunho.");
      setEnviando(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "var(--sp-5)", marginTop: "var(--sp-5)" }}>
      <div className="row-between" style={{ marginBottom: "var(--sp-4)" }}>
        <h3 style={{ margin: 0 }}>Revisar rascunho de {rascunho.remetenteNome || rascunho.remetenteEmail || "remetente desconhecido"}</h3>
        <Confianca valor={rascunho.confiancaGeral} />
      </div>

      {setoresReq.error && <ErrorState error={setoresReq.error} onRetry={setoresReq.reload} />}
      {erro && <div className="alert alert-danger" role="alert" style={{ marginBottom: "var(--sp-4)" }}>{erro}</div>}

      {/* Email cru — auditoria, especialmente se tem anexo (sem OCR no MVP). */}
      <details style={{ marginBottom: "var(--sp-4)" }}>
        <summary style={{ cursor: "pointer" }}>
          Ver email original{rascunho.temAnexo ? " (contém anexo — revise manualmente)" : ""}
        </summary>
        <pre className="email-cru" style={{ whiteSpace: "pre-wrap", marginTop: "var(--sp-2)", fontSize: "var(--fs-12)" }}>
          {rascunho.emailCru || "(sem corpo)"}
        </pre>
      </details>

      <div className="field-row">
        <div style={{ flex: "1 1 240px" }}>
          <label htmlFor="origem">Setor solicitante (origem)</label>
          <select id="origem" value={origemId} onChange={(e) => setOrigemId(e.target.value)}>
            <option value="">Selecione…</option>
            {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          {!origemId && <p className="muted" style={{ fontSize: "var(--fs-12)", marginTop: 4 }}>Escolha de quem é a solicitação.</p>}
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <label htmlFor="destino">Almoxarifado (atende)</label>
          <select id="destino" value={destinoId} disabled>
            {almoxarifados.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      </div>
      {origemId && origemId === destinoId && (
        <p className="alert alert-warn" style={{ marginTop: "var(--sp-3)" }}>Origem e destino devem ser setores diferentes.</p>
      )}

      <div className="field" style={{ marginTop: "var(--sp-4)" }}>
        <label htmlFor="just">Justificativa</label>
        <textarea id="just" rows={2} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
        <p className="muted" style={{ fontSize: "var(--fs-12)", marginTop: 4 }}>
          {justificativa.trim().length}/10 mín. {justOk ? "✓" : ""}
        </p>
      </div>

      <div className="row-between" style={{ margin: "var(--sp-4) 0 var(--sp-3)" }}>
        <h4 style={{ margin: 0 }}>Itens</h4>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItens((a) => [...a, itemVazio()])}>
          + Adicionar item
        </button>
      </div>

      <div className="stack">
        {itens.map((it, idx) => (
          <div key={it.key} className="panel" style={{ padding: "var(--sp-4)" }}>
            <div className="row-between" style={{ marginBottom: "var(--sp-3)" }}>
              <strong style={{ fontSize: "var(--fs-14)" }}>Item {idx + 1}</strong>
              <div className="row" style={{ gap: "var(--sp-2)" }}>
                <div className="row" role="tablist" style={{ gap: 2, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 2 }}>
                  <button type="button" className={`btn btn-sm ${it.modo === "catalogo" ? "btn-primary" : "btn-ghost"}`} onClick={() => atualizarItem(it.key, { modo: "catalogo", descricaoLivre: "" })}>Catálogo</button>
                  <button type="button" className={`btn btn-sm ${it.modo === "livre" ? "btn-primary" : "btn-ghost"}`} onClick={() => atualizarItem(it.key, { modo: "livre", produtoId: "" })}>Linha livre</button>
                </div>
                {itens.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removerItem(it.key)} title="Remover item">Remover</button>
                )}
              </div>
            </div>

            <div className="field-row">
              <div style={{ flex: "2 1 280px" }}>
                {it.modo === "catalogo" ? (
                  <>
                    <label htmlFor={`produto-${it.key}`}>Produto</label>
                    <select id={`produto-${it.key}`} value={it.produtoId} onChange={(e) => atualizarItem(it.key, { produtoId: e.target.value })} disabled={!origemId || catReq.loading}>
                      <option value="">{!origemId ? "Escolha o setor primeiro…" : catReq.loading ? "Carregando catálogo…" : "Selecione o produto…"}</option>
                      {catalogo.map((p) => <option key={p.produtoId} value={p.produtoId}>{p.nome}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label htmlFor={`descricao-${it.key}`}>Descrição (item fora do catálogo)</label>
                    <input id={`descricao-${it.key}`} type="text" placeholder="Ex.: Evidenciador de biofilme" value={it.descricaoLivre} onChange={(e) => atualizarItem(it.key, { descricaoLivre: e.target.value })} />
                  </>
                )}
              </div>
              <div style={{ flex: "0 1 110px" }}>
                <label htmlFor={`qtd-${it.key}`}>Quantidade</label>
                <input id={`qtd-${it.key}`} type="number" min="1" value={it.qtdSolicitada} onChange={(e) => atualizarItem(it.key, { qtdSolicitada: e.target.value })} />
              </div>
              <div style={{ flex: "0 1 140px" }}>
                <label htmlFor={`unidade-${it.key}`}>Unidade</label>
                <select id={`unidade-${it.key}`} value={it.unidade} onChange={(e) => atualizarItem(it.key, { unidade: e.target.value })}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row-between" style={{ marginTop: "var(--sp-5)" }}>
        <button type="button" className="btn btn-ghost" onClick={descartar} disabled={enviando}>Descartar</button>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={enviando}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={aprovar} disabled={!podeAprovar}>
            {enviando ? "Aprovando…" : "Aprovar → vira pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Justificativa inicial: usa o assunto/remetente do rascunho para já passar de 10.
function justificativaInicial(rascunho) {
  const quem = rascunho?.remetenteNome || rascunho?.remetenteEmail || "remetente externo";
  return `Solicitação recebida por email de ${quem} (triagem da Dispensação).`;
}

function formatarData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Badge de confiança — sinaliza <0.6 (extração incerta, revisar com cuidado).
function Confianca({ valor }) {
  if (valor == null) return <span className="muted">—</span>;
  const pct = Math.round(valor * 100);
  const baixa = valor < 0.6;
  return (
    <span className={`badge ${baixa ? "st-critico" : "st-ok"}`} title={baixa ? "Confiança baixa — revise com atenção" : "Confiança boa"}>
      {pct}%{baixa ? " ⚠" : ""}
    </span>
  );
}
