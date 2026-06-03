// =============================================================================
// Estoque do CEO (CEO-237 · EP03) — lista o estoque local do setor do usuário:
// produto, categoria, quantidade total, mínimo, unidade e status agregado.
//
// Fonte: GET /setores/:setorId/estoque (EstoqueService do backend). O setorId é
// o da própria identidade do usuário logado (RBAC: podeVerSetor sempre permite o
// próprio setor). Filtros (texto/categoria/status) batem com FiltrosCatalogo.
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { estoqueDoSetor, type FiltrosEstoque } from "@/api/estoque";
import { ApiError } from "@/api/client";
import { classeBadgeStatus, rotuloStatus } from "@/lib/status";
import type { Categoria, ProdutoComEstoque, StatusProduto } from "@/types/domain";

// Ordem de exibição dos filtros (espelha os enums de domain.ts do backend).
const CATEGORIAS: Categoria[] = [
  "EPI",
  "Anestésico",
  "Material Restaurador",
  "Instrumentais",
  "Higienização",
  "Material Cirúrgico",
  "Equipamento",
  "Outros",
];

// Status que fazem sentido filtrar no CEO (destinatário): 'excessivo' (RN04) só
// ocorre em setor almoxarifado, então fica de fora da lista de filtro aqui.
const STATUS_FILTRO: StatusProduto[] = [
  "indisponivel",
  "vencido",
  "vencendo",
  "atencao",
  "critico",
  "baixo",
  "normal",
];

function StatusBadge({ status }: { status: StatusProduto }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classeBadgeStatus(status)}`}
    >
      {rotuloStatus(status)}
    </span>
  );
}

export function EstoqueCEO() {
  const { identidade } = useAuth();
  const setorId = identidade?.setorId ?? null;

  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [status, setStatus] = useState<StatusProduto | "">("");

  const [linhas, setLinhas] = useState<ProdutoComEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const filtros = useMemo<FiltrosEstoque>(() => {
    const f: FiltrosEstoque = {};
    const t = texto.trim();
    if (t) f.texto = t;
    if (categoria) f.categoria = categoria;
    if (status) f.status = status;
    return f;
  }, [texto, categoria, status]);

  const carregar = useCallback(async () => {
    if (setorId === null) return;
    setCarregando(true);
    setErro(null);
    try {
      setLinhas(await estoqueDoSetor(setorId, filtros));
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : "Não foi possível carregar o estoque.",
      );
    } finally {
      setCarregando(false);
    }
  }, [setorId, filtros]);

  // Recarrega quando os filtros mudam, com um pequeno debounce no texto.
  useEffect(() => {
    const id = setTimeout(carregar, 250);
    return () => clearTimeout(id);
  }, [carregar]);

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque do CEO</h1>
          <p className="mt-1 text-gray-600">
            Estoque local do CEO: produto, categoria, quantidade, mínimo e status.
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
          CEO-237 · EP03
        </span>
      </header>

      {/* Filtros — texto, categoria e status (US-EP02-03). */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nome do produto…"
          aria-label="Buscar por nome do produto"
          className="min-w-56 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria | "")}
          aria-label="Filtrar por categoria"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusProduto | "")}
          aria-label="Filtrar por status"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS_FILTRO.map((s) => (
            <option key={s} value={s}>
              {rotuloStatus(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Estados: erro > carregando > vazio > tabela. */}
      {erro ? (
        <div className="mt-8 rounded-lg border border-status-critico/30 bg-status-critico/5 p-4 text-sm text-status-critico">
          {erro}
          <button
            type="button"
            onClick={carregar}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Tentar de novo
          </button>
        </div>
      ) : carregando ? (
        <p className="mt-8 text-sm text-gray-400">Carregando estoque…</p>
      ) : linhas.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
          Nenhum produto encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Qtd.</th>
                <th className="px-4 py-3 text-right">Mínimo</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {linhas.map((l) => (
                <tr key={l.produtoId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{l.categoria}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                    {l.qtdTotal}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                    {l.estoqueMinimo}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.unidade}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
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
