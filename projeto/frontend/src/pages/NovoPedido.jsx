import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { listarSetores } from "../api/setores.js";
import { catalogoDoSetor } from "../api/estoque.js";
import { criarPedido } from "../api/pedidos.js";
import { UNIDADES } from "../api/constants.js";
import { ApiError } from "../api/client.js";
import { PageHead, ErrorState } from "../app/ui.jsx";

let _uid = 0;
const novoItem = () => ({
  key: ++_uid,
  modo: "catalogo",     // "catalogo" | "livre"
  produtoId: "",
  descricaoLivre: "",
  qtdSolicitada: 1,
  unidade: "unidade",
});

export default function NovoPedido() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const setoresReq = useFetch(() => listarSetores(), []);
  const setores = useMemo(() => setoresReq.data ?? [], [setoresReq.data]);

  const [origemId, setOrigemId] = useState(user?.setorId ?? "");
  const [destinoEscolhido, setDestinoEscolhido] = useState(""); // "" = ainda usando o padrão
  const [justificativa, setJustificativa] = useState("");
  const [itens, setItens] = useState([novoItem()]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Destino efetivo = escolha explícita do usuário, ou o primeiro almoxarifado
  // (derivado, sem efeito + setState).
  const almoxarifados = useMemo(() => setores.filter((s) => s.tipo === "almoxarifado"), [setores]);
  const destinoId = destinoEscolhido || (almoxarifados[0] ? String(almoxarifados[0].id) : "");
  const setDestinoId = setDestinoEscolhido;

  // Catálogo do setor de origem (para o seletor de produto).
  const catReq = useFetch(() => (origemId ? catalogoDoSetor(origemId) : Promise.resolve([])), [origemId]);
  const catalogo = catReq.data ?? [];

  function atualizarItem(key, patch) {
    setItens((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function removerItem(key) {
    setItens((arr) => (arr.length === 1 ? arr : arr.filter((it) => it.key !== key)));
  }

  const justOk = justificativa.trim().length >= 10;

  const itensValidos = useMemo(
    () =>
      itens.every((it) => {
        const qtd = Number(it.qtdSolicitada) > 0;
        const identificado = it.modo === "catalogo" ? !!it.produtoId : it.descricaoLivre.trim().length > 0;
        return qtd && identificado && it.unidade;
      }),
    [itens],
  );

  // origemId pode vir como número (user.setorId) e destinoId sempre como string;
  // normalizamos para comparar corretamente "mesmo setor".
  const setoresDiferentes = String(origemId) !== String(destinoId);
  const podeEnviar = origemId && destinoId && setoresDiferentes && justOk && itensValidos && !enviando;

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!podeEnviar) return;
    setEnviando(true);
    try {
      const payload = {
        setorOrigemId: Number(origemId),
        setorDestinoId: Number(destinoId),
        solicitanteId: user.id,
        justificativa: justificativa.trim(),
        // XOR (INV07): manda produtoId OU descricaoLivre, nunca os dois.
        itens: itens.map((it) =>
          it.modo === "catalogo"
            ? { produtoId: Number(it.produtoId), qtdSolicitada: Number(it.qtdSolicitada), unidade: it.unidade }
            : { descricaoLivre: it.descricaoLivre.trim(), qtdSolicitada: Number(it.qtdSolicitada), unidade: it.unidade },
        ),
      };
      const pedido = await criarPedido(payload);
      navigate(`/pedidos/${pedido.id}`, { replace: true, state: { criado: true } });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PageHead title="Novo pedido" sub="Solicite materiais ao almoxarifado. Itens do catálogo ou em linha livre." />

      {setoresReq.error && <ErrorState error={setoresReq.error} onRetry={setoresReq.reload} />}
      {erro && <div className="alert alert-danger" role="alert" style={{ marginBottom: "var(--sp-4)" }}>{erro}</div>}

      <form onSubmit={enviar} style={{ maxWidth: 820 }}>
        <div className="panel" style={{ padding: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
          <div className="field-row">
            <div style={{ flex: "1 1 240px" }}>
              <label htmlFor="origem">Setor solicitante (origem)</label>
              <select id="origem" value={origemId} onChange={(e) => setOrigemId(e.target.value)}>
                <option value="">Selecione…</option>
                {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 240px" }}>
              <label htmlFor="destino">Almoxarifado (atende)</label>
              <select id="destino" value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
                <option value="">Selecione…</option>
                {setores.filter((s) => s.tipo === "almoxarifado").map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          {origemId && destinoId && !setoresDiferentes && (
            <p className="alert alert-warn" style={{ marginTop: "var(--sp-3)" }}>Origem e destino devem ser setores diferentes.</p>
          )}

          <div className="field" style={{ marginTop: "var(--sp-4)", marginBottom: 0 }}>
            <label htmlFor="just">Justificativa</label>
            <textarea
              id="just" rows={2} placeholder="Ex.: Reposição semanal do CEO (mín. 10 caracteres)"
              value={justificativa} onChange={(e) => setJustificativa(e.target.value)}
            />
            <p className="muted" style={{ fontSize: "var(--fs-12)", marginTop: 4 }}>
              {justificativa.trim().length}/10 mín. {justOk ? "✓" : ""}
            </p>
          </div>
        </div>

        {/* Itens */}
        <div className="row-between" style={{ marginBottom: "var(--sp-3)" }}>
          <h3>Itens do pedido</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItens((a) => [...a, novoItem()])}>
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
                    <button
                      type="button"
                      className={`btn btn-sm ${it.modo === "catalogo" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => atualizarItem(it.key, { modo: "catalogo", descricaoLivre: "" })}
                    >Catálogo</button>
                    <button
                      type="button"
                      className={`btn btn-sm ${it.modo === "livre" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => atualizarItem(it.key, { modo: "livre", produtoId: "" })}
                    >Linha livre</button>
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
                      <select
                        id={`produto-${it.key}`}
                        value={it.produtoId}
                        onChange={(e) => atualizarItem(it.key, { produtoId: e.target.value })}
                        disabled={!origemId || catReq.loading}
                      >
                        <option value="">{catReq.loading ? "Carregando catálogo…" : "Selecione o produto…"}</option>
                        {catalogo.map((p) => (
                          <option key={p.produtoId} value={p.produtoId}>{p.nome}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor={`descricao-${it.key}`}>Descrição (item fora do catálogo)</label>
                      <input
                        id={`descricao-${it.key}`}
                        type="text" placeholder="Ex.: Evidenciador de biofilme"
                        value={it.descricaoLivre}
                        onChange={(e) => atualizarItem(it.key, { descricaoLivre: e.target.value })}
                      />
                    </>
                  )}
                </div>
                <div style={{ flex: "0 1 110px" }}>
                  <label htmlFor={`qtd-${it.key}`}>Quantidade</label>
                  <input
                    id={`qtd-${it.key}`}
                    type="number" min="1" value={it.qtdSolicitada}
                    onChange={(e) => atualizarItem(it.key, { qtdSolicitada: e.target.value })}
                  />
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

        <div className="row" style={{ marginTop: "var(--sp-5)" }}>
          <button type="submit" className="btn btn-primary" disabled={!podeEnviar}>
            {enviando ? "Enviando…" : "Criar pedido"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/pedidos")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
