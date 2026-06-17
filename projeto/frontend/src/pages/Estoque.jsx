import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useFetch } from "../app/useFetch.js";
import { listarSetores } from "../api/setores.js";
import { estoqueDoSetor, catalogoDoSetor } from "../api/estoque.js";
import { CATEGORIAS, STATUS_ESTOQUE, PERFIL } from "../api/constants.js";
import { PageHead, StatusEstoque, TableSkeleton, ErrorState, EmptyState } from "../app/ui.jsx";

export default function Estoque() {
  const { user } = useAuth();
  const ehSolicitante = user?.perfil === PERFIL.SOLICITANTE;

  const [setorId, setSetorId] = useState(user?.setorId ?? null);
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("");

  const setoresReq = useFetch(() => listarSetores(), []);
  const setores = useMemo(() => setoresReq.data ?? [], [setoresReq.data]);

  // Filtros aplicados (texto via debounce simples no submit do form).
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  const itensReq = useFetch(() => {
    if (!setorId) return Promise.resolve([]);
    return ehSolicitante
      ? catalogoDoSetor(setorId, filtrosAplicados)
      : estoqueDoSetor(setorId, filtrosAplicados);
  }, [setorId, ehSolicitante, JSON.stringify(filtrosAplicados)]);

  const itens = itensReq.data ?? [];

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

  return (
    <div>
      <PageHead
        title="Estoque"
        sub={ehSolicitante ? "Catálogo disponível para solicitação." : "Saldo e situação por produto."}
      />

      {/* Barra de filtros */}
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

      {/* Resultado */}
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
              {itens.map((p) => (
                <tr key={p.produtoId}>
                  <td>{p.nome}</td>
                  <td className="text-2">{p.categoria}</td>
                  <td className="num">{p.qtdTotal}</td>
                  <td className="text-2">{p.unidade}</td>
                  {!ehSolicitante && <td><StatusEstoque status={p.status} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nomeSetor && !itensReq.loading && itens.length > 0 && (
        <p className="muted" style={{ marginTop: "var(--sp-3)", fontSize: "var(--fs-13)" }}>
          {itens.length} {itens.length === 1 ? "produto" : "produtos"} em {nomeSetor}.
        </p>
      )}
    </div>
  );
}
