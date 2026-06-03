// =============================================================================
// Dashboard — visão geral do setor do usuário. Agrega o estoque (GET
// /setores/:setorId/estoque) e os pedidos (GET /setores/:setorId/pedidos) que o
// usuário já tem acesso, sem rota nova. Cartões de resumo + atalhos.
// =============================================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { estoqueDoSetor } from "@/api/estoque";
import { pedidosDoSetor } from "@/api/pedidos";
import { ApiError } from "@/api/client";
import { classeBadgeStatus, rotuloStatus } from "@/lib/status";
import type { ProdutoComEstoque, PedidoComItens } from "@/types/domain";

// Status que pedem atenção (ordem de severidade decrescente).
const STATUS_ATENCAO = [
  "indisponivel",
  "vencido",
  "vencendo",
  "atencao",
  "critico",
  "baixo",
] as const;

function Cartao({ titulo, valor, destaque }: { titulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-gray-200">
      <div className="text-sm text-gray-500">{titulo}</div>
      <div className={`mt-1 text-3xl font-bold ${destaque ? "text-status-critico" : "text-gray-900"}`}>
        {valor}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { usuario, identidade } = useAuth();
  const setorId = identidade?.setorId ?? null;

  const [estoque, setEstoque] = useState<ProdutoComEstoque[]>([]);
  const [pedidos, setPedidos] = useState<PedidoComItens[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (setorId === null) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    Promise.all([estoqueDoSetor(setorId), pedidosDoSetor(setorId)])
      .then(([e, p]) => {
        if (!ativo) return;
        setEstoque(e);
        setPedidos(p);
      })
      .catch((err) => {
        if (ativo) {
          setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o resumo.");
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [setorId]);

  const resumo = useMemo(() => {
    const precisamAtencao = estoque.filter((p) =>
      (STATUS_ATENCAO as readonly string[]).includes(p.status),
    );
    const indisponiveis = estoque.filter((p) => p.status === "indisponivel").length;
    const pedidosPendentes = pedidos.filter(
      (p) => p.status === "pendente" || p.status === "em_processamento",
    ).length;
    return {
      totalProdutos: estoque.length,
      precisamAtencao,
      indisponiveis,
      pedidosPendentes,
    };
  }, [estoque, pedidos]);

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {usuario?.nome ?? "bem-vindo"}
        </h1>
        <p className="mt-1 text-gray-600">Visão geral do estoque e das solicitações do seu setor.</p>
      </header>

      {erro ? (
        <div className="mt-8 rounded-lg border border-status-critico/30 bg-status-critico/5 p-4 text-sm text-status-critico">
          {erro}
        </div>
      ) : carregando ? (
        <p className="mt-8 text-sm text-gray-400">Carregando resumo…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Cartao titulo="Produtos no catálogo" valor={resumo.totalProdutos} />
            <Cartao titulo="Precisam de atenção" valor={resumo.precisamAtencao.length} destaque />
            <Cartao titulo="Indisponíveis" valor={resumo.indisponiveis} destaque />
            <Cartao titulo="Pedidos em aberto" valor={resumo.pedidosPendentes} />
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Produtos que precisam de atenção</h2>
              <Link
                to="/estoque-ceo"
                className="text-sm font-medium text-brand hover:text-brand-strong"
              >
                Ver estoque →
              </Link>
            </div>
            {resumo.precisamAtencao.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
                Nada pedindo atenção agora. 👍
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-right">Qtd.</th>
                      <th className="px-4 py-3 text-right">Mínimo</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resumo.precisamAtencao.slice(0, 10).map((p) => (
                      <tr key={p.produtoId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                          {p.qtdTotal}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                          {p.estoqueMinimo}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classeBadgeStatus(p.status)}`}
                          >
                            {rotuloStatus(p.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
