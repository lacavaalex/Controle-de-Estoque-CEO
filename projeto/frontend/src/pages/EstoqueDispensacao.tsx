// =============================================================================
// Estoque da Dispensação (HO) — EP02. Catálogo/estoque agregado do almoxarifado
// central, com DETALHE DE LOTE: expandir um produto lista seus lotes (número,
// validade, quantidade, estado e estado de validade), ordenados por validade
// (FEFO — o que vence antes aparece primeiro).
//
// Fonte: GET /setores/:setorId/estoque + GET /produtos/:id/lotes. Usa o setorId
// da própria identidade do usuário (HO): pela RN12/podeVerSetor, quem vê o HO é
// almoxarife/gestor do HO, cujo próprio setor JÁ é o almoxarifado — então o
// setorId da identidade é o setorId do HO. Não há rota de descoberta de setor e
// não precisamos dela aqui.
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { estoqueDoSetor, type FiltrosEstoque } from "@/api/estoque";
import { lotesDoProduto } from "@/api/lotes";
import { ApiError } from "@/api/client";
import { TabelaEstoque } from "@/components/TabelaEstoque";
import {
  classeBadgeValidade,
  rotuloEstadoLote,
  rotuloStatus,
  rotuloValidade,
} from "@/lib/status";
import { formatarData } from "@/lib/data";
import type {
  Categoria,
  LoteComEstado,
  ProdutoComEstoque,
  StatusProduto,
} from "@/types/domain";

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

// No HO (almoxarifado), 'excessivo' (RN04) é um status possível — incluímos.
const STATUS_FILTRO: StatusProduto[] = [
  "indisponivel",
  "vencido",
  "vencendo",
  "atencao",
  "critico",
  "baixo",
  "excessivo",
  "normal",
];

// ─── Detalhe de lotes de um produto (carrega ao expandir) ────────────────────
function DetalheLotes({ produtoId, setorId }: { produtoId: number; setorId: number }) {
  const [lotes, setLotes] = useState<LoteComEstado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    lotesDoProduto(produtoId, setorId)
      .then((l) => {
        if (ativo) setLotes(l);
      })
      .catch((err) => {
        if (ativo) {
          setErro(err instanceof ApiError ? err.message : "Falha ao carregar lotes.");
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [produtoId, setorId]);

  if (carregando) return <p className="text-sm text-gray-400">Carregando lotes…</p>;
  if (erro) return <p className="text-sm text-status-critico">{erro}</p>;
  if (lotes.length === 0) {
    return <p className="text-sm text-gray-400">Nenhum lote ativo para este produto.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md ring-1 ring-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-white text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
          <tr>
            <th className="px-3 py-2">Nº do lote</th>
            <th className="px-3 py-2">Validade</th>
            <th className="px-3 py-2 text-right">Qtd.</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2">Situação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lotes.map((lote) => (
            <tr key={lote.id}>
              <td className="px-3 py-2 font-medium text-gray-800">{lote.numeroLote}</td>
              <td className="px-3 py-2 text-gray-600">{formatarData(lote.validade)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                {lote.quantidade}
              </td>
              <td className="px-3 py-2 text-gray-600">{rotuloEstadoLote(lote.estado)}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classeBadgeValidade(lote.estadoValidade)}`}
                >
                  {rotuloValidade(lote.estadoValidade)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EstoqueDispensacao() {
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
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o estoque.");
    } finally {
      setCarregando(false);
    }
  }, [setorId, filtros]);

  useEffect(() => {
    const id = setTimeout(carregar, 250);
    return () => clearTimeout(id);
  }, [carregar]);

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque da Dispensação (HO)</h1>
          <p className="mt-1 text-gray-600">
            Catálogo e estoque do almoxarifado central. Expanda um produto para ver os lotes.
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
          EP02
        </span>
      </header>

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
        <div className="mt-6">
          <TabelaEstoque
            linhas={linhas}
            renderDetalhe={(produto) =>
              setorId !== null ? (
                <DetalheLotes produtoId={produto.produtoId} setorId={setorId} />
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
}
