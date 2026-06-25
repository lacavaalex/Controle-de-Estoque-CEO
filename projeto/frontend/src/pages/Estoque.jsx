import { Fragment, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { listarSetores } from "../api/setores.js";
import { 
  estoqueDoSetor, 
  catalogoDoSetor, 
  lotesDoProduto, 
  registrarConsumoLote, 
  ajustarSaldoLote,
  segregarLote,
  segregadosDoSetor
} from "../api/estoque.js";
import { CATEGORIAS, STATUS_ESTOQUE, PERFIL } from "../api/constants.js";
import { PageHead, StatusEstoque, TableSkeleton, ErrorState, EmptyState } from "../app/ui.jsx";
import NovoLote from "../components/NovoLote.jsx";

export default function Estoque() {
  const { user } = useAuth();
  const ehSolicitante = user?.perfil === PERFIL.SOLICITANTE;

  const [setorId, setSetorId] = useState(user?.setorId ?? null);
  const [visaoAtual, setVisaoAtual] = useState("estoque");
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("");

  const setoresReq = useFetch(() => listarSetores(), []);
  const setores = useMemo(() => setoresReq.data ?? [], [setoresReq.data]);

  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  const itensReq = useFetch(() => {
    if (!setorId) return Promise.resolve([]);
    return ehSolicitante
      ? catalogoDoSetor(setorId, filtrosAplicados)
      : estoqueDoSetor(setorId, filtrosAplicados);
  }, [setorId, ehSolicitante, JSON.stringify(filtrosAplicados)]);

  const itens = itensReq.data ?? [];

  const segregadosReq = useFetch(() => {
    if (!setorId || visaoAtual !== 'segregados') return Promise.resolve([]);
    return segregadosDoSetor(setorId);
  }, [setorId, visaoAtual]);

  const lotesSegregados = segregadosReq.data ?? [];

  const [produtoExpandidoId, setProdutoExpandidoId] = useState(null);

  function aplicar(e) {
    e?.preventDefault();
    setFiltrosAplicados({
      texto: texto.trim() || undefined,
      categoria: categoria || undefined,
      status: status || undefined,
    });
  }

  function limpar() {
    setTexto(""); setCategoria(""); setStatus("");
    setFiltrosAplicados({});
  }

  const nomeSetor = useMemo(
    () => setores.find((s) => String(s.id) === String(setorId))?.nome,
    [setores, setorId],
  );

  // US-EP03-03 (CEO-238) — Trata o clique de consumo clínico
  async function handleConsumo(loteId) {
    const qtd = prompt("Quantas unidades foram consumidas na clínica?");
    if (!qtd) return;
    const obs = prompt("Observação (Opcional):", "Uso clínico padrão");
    
    try {
      await registrarConsumoLote(loteId, Number(qtd), obs);
      alert("Consumo clínico registrado com sucesso!");
      itensReq.reload(); 
    } catch (err) {
      alert(err.response?.data?.mensagem || "Erro ao registrar consumo");
    }
  }

  // US-EP03-04 (CEO-239) — Trata o clique de recontagem física de inventário
  async function handleAjuste(loteId) {
    const qtd = prompt("Qual a nova contagem física absoluta deste lote?");
    if (qtd === null || qtd.trim() === "") return;
    const obs = prompt("Observação / Justificativa (Obrigatório):");
    if (!obs || obs.trim() === "") {
      alert("Justificativa é obrigatória para ajustes de recontagem!");
      return;
    }

    try {
      await ajustarSaldoLote(loteId, Number(qtd), obs);
      alert("Recontagem de estoque registrada!");
      itensReq.reload();
    } catch (err) {
      alert(err.response?.data?.mensagem || "Erro ao ajustar inventário");
    }
  }

  // Componente que renderiza os lotes reais filhos sob a linha pai correspondente
  function DetalheLotes({ produtoId, setorId }) {
    const [exibirNovoLote, setExibirNovoLote] = useState(false);
    const lotesReq = useFetch(
      () => lotesDoProduto(produtoId, setorId, true),
      [produtoId, setorId]
    );

    const lotes = (lotesReq.data ?? []).filter(l => l.estado !== 'segregado');

    if (lotesReq.loading) {
      return (
        <tr>
          <td colSpan="5" style={{ padding: "15px", color: "#666", textAlign: "center" }}>
            Carregando lotes ativos...
          </td>
        </tr>
      );
    }

    return (
      <tr style={{ backgroundColor: '#f9f9f9' }}>
        <td colSpan="5" style={{ padding: 'var(--sp-4)' }}>
          <div style={{ borderLeft: '3px solid #990000', paddingLeft: 'var(--sp-3)' }}>
            
            {/* Cabeçalho flexível com o título e o botão */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--sp-2)" }}>
              <h4 style={{ color: "#111111", fontSize: "var(--fs-14)", margin: 0 }}>
                Lotes Ativos no Setor
              </h4>
              {/* Botão para abrir o formulário */}
              {!exibirNovoLote && (
                <button 
                  className="btn btn-sm btn-primary" 
                  onClick={() => setExibirNovoLote(true)}
                >
                  + Novo Lote
                </button>
              )}
            </div>

            {/* Renderização condicional do formulário */}
            {exibirNovoLote && (
              <NovoLote 
                produtoId={produtoId} 
                onSuccess={() => {
                  setExibirNovoLote(false);
                  lotesReq.reload();
                  itensReq.reload();
                }}
                onCancel={() => setExibirNovoLote(false)}
              />
            )}

            {lotes.length === 0 && !exibirNovoLote ? (
              <p style={{ color: "#666", margin: 0, marginTop: "var(--sp-2)" }}>Nenhum lote ativo encontrado para este setor.</p>
            ) : (
              !exibirNovoLote && (
                <table style={{ width: "100%", fontSize: "var(--fs-13)", marginTop: "var(--sp-2)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                      <th style={{ textAlign: "left" }}>Nº Lote</th>
                      <th style={{ textAlign: "left" }}>Validade</th>
                      <th className="num" style={{ textAlign: "right" }}>Qtd. Atual</th>
                      <th className="num" style={{ textAlign: "right", paddingRight: "10px" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map((l) => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px 0" }}><code>{l.numeroLote}</code></td>
                        <td>{new Date(l.validade).toLocaleDateString("pt-BR")}</td>
                        <td className="num" style={{ textAlign: "right" }}><strong>{l.quantidade}</strong></td>
                        <td className="num" style={{ textAlign: "right" }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            style={{ marginRight: "5px", padding: "2px 8px" }} 
                            onClick={(e) => { e.stopPropagation(); handleConsumo(l.id); }}
                          >
                            Consumo
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            style={{ padding: "2px 8px" }}
                            onClick={(e) => { e.stopPropagation(); handleAjuste(l.id); }}
                          >
                            Recontar
                          </button>
                          {l.estadoValidade === "vencido" && (
                            <button 
                              className="btn btn-sm btn-danger" 
                              style={{ marginLeft: "5px", padding: "2px 8px" }}
                              onClick={(e) => { e.stopPropagation(); handleSegregar(l.id); }}
                            >
                              Segregar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </td>
      </tr>
    );
  }

  async function handleSegregar(loteId) {
    const obs = prompt("Justificativa para a segregação do lote (Obrigatório):", "Material vencido identificado na recontagem");
    if (!obs || obs.trim() === "") {
      alert("É obrigatório informar o motivo da segregação!");
      return;
    }

    try {
      await segregarLote(loteId, obs);
      alert("Lote enviado para a sala de biossegurança (segregado)!");
      itensReq.reload();
    } catch (err) {
      alert(err.response?.data?.mensagem || "Erro ao segregar lote");
    }
  }

  return (
    <div>
      <PageHead
        title="Estoque"
        sub={ehSolicitante ? "Catálogo disponível para solicitação." : "Saldo e situação por produto."}
      />

      {/* Abas de Navegação (Escondidas do Solicitante) */}
      {!ehSolicitante && (
        <div style={{ marginBottom: 'var(--sp-4)', display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${visaoAtual === 'estoque' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVisaoAtual('estoque')}
          >
            Estoque Ativo
          </button>
          <button 
            className={`btn ${visaoAtual === 'segregados' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVisaoAtual('segregados')}
          >
            Lotes Segregados
          </button>
        </div>
      )}

      {/* Condicional Principal: Estoque x Segregados */}
      {visaoAtual === 'estoque' ? (
        <>
          {/* VISÃO ESTOQUE ATIVO */}
          <form className="panel" style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-5)" }} onSubmit={aplicar}>
            <div className="field-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 220px" }}>
                <label htmlFor="setor">Setor</label>
                <select id="setor" value={setorId ?? ""} onChange={(e) => setSetorId(e.target.value)}>
                  {!setorId && <option value="">Selecione…</option>}
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "2 1 240px" }}>
                <label htmlFor="busca">Buscar</label>
                <input id="busca" type="text" placeholder="Nome do produto…" value={texto} onChange={(e) => setTexto(e.target.value)} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label htmlFor="cat">Categoria</label>
                <select id="cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Todas</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {!ehSolicitante && (
                <div style={{ flex: "1 1 160px" }}>
                  <label htmlFor="st">Situação</label>
                  <select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Todas</option>
                    {STATUS_ESTOQUE.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="row">
                <button type="submit" className="btn btn-primary">Filtrar</button>
                <button type="button" className="btn btn-secondary" onClick={limpar}>Limpar</button>
              </div>
            </div>
          </form>

          {itensReq.loading ? (
            <TableSkeleton rows={6} cols={ehSolicitante ? 4 : 5} />
          ) : itensReq.error ? (
            <ErrorState error={itensReq.error} onRetry={itensReq.reload} />
          ) : itens.length === 0 ? (
            <div className="panel">
              <EmptyState title="Nenhum produto encontrado">
                {setorId ? "Ajuste os filtros ou troque de setor." : "Selecione um setor para ver o estoque."}
              </EmptyState>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th className="num">Qtd.</th>
                    <th>Unidade</th>
                    {!ehSolicitante && <th>Situação</th>}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((p) => {
                    const estaExpandido = produtoExpandidoId === p.produtoId;
                    return (
                      // Fragment, não <tr> envolvente: <tr> dentro de <tr> é HTML
                      // inválido e o React 19 dropa o conteúdo da linha interna.
                      <Fragment key={p.produtoId}>
                        <tr
                          style={{ cursor: ehSolicitante ? 'default' : 'pointer' }}
                          onClick={() => !ehSolicitante && setProdutoExpandidoId(estaExpandido ? null : p.produtoId)}
                          className={estaExpandido ? "selected-row" : ""}
                        >
                          <td>
                            {!ehSolicitante && (estaExpandido ? "▼ " : "▶ ")}
                            {p.nome}
                          </td>
                          <td className="text-2">{p.categoria}</td>
                          <td className="num">{p.qtdTotal}</td>
                          <td className="text-2">{p.unidade}</td>
                          {!ehSolicitante && <td><StatusEstoque status={p.status} /></td>}
                        </tr>
                        {estaExpandido && !ehSolicitante && (
                          <DetalheLotes produtoId={p.produtoId} setorId={setorId} />
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {nomeSetor && !itensReq.loading && itens.length > 0 && (
            <p className="muted" style={{ marginTop: "var(--sp-3)", fontSize: "var(--fs-13)" }}>
              {itens.length} {itens.length === 1 ? "produto" : "produtos"} em {nomeSetor}.
            </p>
          )}
        </>
      ) : (
        /* VISÃO LOTES SEGREGADOS */
        <div className="panel" style={{ padding: 'var(--sp-4)' }}>
           <h3 style={{ marginBottom: "var(--sp-2)", color: "#990000" }}>Sala de Biossegurança</h3>
           <p style={{ color: '#666', marginBottom: 'var(--sp-4)' }}>
             Lotes vencidos ou danificados aguardando descarte.
           </p>

           {segregadosReq.loading ? (
             <TableSkeleton rows={3} cols={5} />
           ) : segregadosReq.error ? (
             <ErrorState error={segregadosReq.error} onRetry={segregadosReq.reload} />
           ) : lotesSegregados.length === 0 ? (
             <EmptyState title="Nenhum lote segregado">
               Este setor não possui lotes na sala de biossegurança.
             </EmptyState>
           ) : (
             <div className="table-wrap">
               <table className="data">
                 <thead>
                   <tr>
                     <th>Produto</th>
                     <th>Nº Lote</th>
                     <th>Data Segregação</th>
                     <th className="num">Qtd.</th>
                     <th>Motivo</th>
                   </tr>
                 </thead>
                 <tbody>
                   {lotesSegregados.map((l) => (
                     <tr key={l.id}>
                       <td>{l.produtoNome}</td>
                       <td><code>{l.numeroLote}</code></td>
                       <td>{l.dataSegregacao ? new Date(l.dataSegregacao).toLocaleDateString("pt-BR") : "-"}</td>
                       <td className="num">{l.quantidade}</td>
                       <td className="text-2" style={{ maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={l.observacaoSegregacao}>
                         {l.observacaoSegregacao || "-"}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      )}
    </div>
  );
  }