// =============================================================================
// Solicitações / Pedidos (EP04 + EP03) — cria pedidos multi-item, acompanha o
// processamento e (para almoxarife/gestor HO) EXPEDE item-a-item (RN11/RN19).
// Lista os pedidos do setor do usuário (origem OU destino, RN12).
//
// Fonte: GET /setores/:setorId/pedidos (lista) + POST /pedidos (criar) +
// POST /pedidos/:id/itens/:itemId/expedir (processar). Usa o setorId da
// própria identidade; a ação de expedir só aparece para quem pode processar.
// =============================================================================
import { Fragment, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { expedirItem, pedidosDoSetor } from "@/api/pedidos";
import { ApiError } from "@/api/client";
import { podeProcessarPedidos } from "@/lib/rbac";
import { NovoPedidoForm } from "@/components/NovoPedidoForm";
import {
  classeBadgeItem,
  classeBadgePedido,
  rotuloItem,
  rotuloMotivo,
  rotuloPedido,
} from "@/lib/status";
import { formatarData } from "@/lib/data";
import type { ItemDoPedido, PedidoComItens } from "@/types/domain";

interface DetalheItensProps {
  itens: ItemDoPedido[];
  // Quando definido, mostra a ação "Expedir" nos itens elegíveis (almoxarife/HO).
  onExpedir?: (itemId: number) => void;
  expedindoId?: number | null;
}

// Um item é expedível pela UI quando: é produto de catálogo (tem lote), está
// pendente e não é um item-filho de desdobramento. O backend revalida tudo.
function itemExpedivel(item: ItemDoPedido): boolean {
  return (
    item.statusItem === "pendente" &&
    item.produtoId !== null &&
    item.itemPaiId === null
  );
}

function DetalheItens({ itens, onExpedir, expedindoId }: DetalheItensProps) {
  if (itens.length === 0) {
    return <p className="text-sm text-gray-400">Sem itens.</p>;
  }
  const podeExpedir = onExpedir !== undefined;
  return (
    <div className="overflow-x-auto rounded-md ring-1 ring-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-white text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
          <tr>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2 text-right">Solic.</th>
            <th className="px-3 py-2 text-right">Exped.</th>
            <th className="px-3 py-2">Unidade</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Divergência</th>
            {podeExpedir && <th className="px-3 py-2 text-right">Ação</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {itens.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2 text-gray-800">
                {item.descricaoLivre ?? `Produto #${item.produtoId}`}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                {item.qtdSolicitada}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                {item.qtdExpedida ?? "—"}
              </td>
              <td className="px-3 py-2 text-gray-600">{item.unidade}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classeBadgeItem(item.statusItem)}`}
                >
                  {rotuloItem(item.statusItem)}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-500">
                {item.motivoDivergencia ? rotuloMotivo(item.motivoDivergencia) : "—"}
              </td>
              {podeExpedir && (
                <td className="px-3 py-2 text-right">
                  {itemExpedivel(item) ? (
                    <button
                      type="button"
                      onClick={() => onExpedir(item.id)}
                      disabled={expedindoId === item.id}
                      className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                    >
                      {expedindoId === item.id ? "Expedindo…" : "Expedir"}
                    </button>
                  ) : item.descricaoLivre !== null ? (
                    <span
                      className="text-xs text-gray-400"
                      title="Itens de descrição livre não têm lote no catálogo"
                    >
                      sem lote
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Solicitacoes() {
  const { identidade } = useAuth();
  const setorId = identidade?.setorId ?? null;
  // Almoxarife/gestor HO pode processar (expedir) itens — RN11. O backend
  // revalida; aqui é só para mostrar a ação.
  const podeProcessar = identidade !== null && podeProcessarPedidos(identidade);

  const [pedidos, setPedidos] = useState<PedidoComItens[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [expedindoId, setExpedindoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (setorId === null) return;
    setCarregando(true);
    setErro(null);
    try {
      setPedidos(await pedidosDoSetor(setorId));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os pedidos.");
    } finally {
      setCarregando(false);
    }
  }, [setorId]);

  const aoExpedir = useCallback(
    async (pedidoId: string, itemId: number) => {
      setExpedindoId(itemId);
      setAviso(null);
      try {
        const r = await expedirItem(pedidoId, itemId);
        setAviso(
          `Item expedido (${r.item.qtdExpedida}/${r.item.qtdSolicitada}). ` +
            `${r.movimentacoes.length} movimentação(ões): ${r.movimentacoes.join(", ")}.`,
        );
        await carregar();
      } catch (err) {
        setAviso(err instanceof ApiError ? `Falha ao expedir: ${err.message}` : "Falha ao expedir o item.");
      } finally {
        setExpedindoId(null);
      }
    },
    [carregar],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações / Pedidos</h1>
          <p className="mt-1 text-gray-600">
            Crie pedidos multi-item e acompanhe o processamento de cada item.
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
          EP04
        </span>
      </header>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setCriando((v) => !v)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          {criando ? "Fechar" : "Novo pedido"}
        </button>
      </div>

      {criando && (
        <div className="mt-4 rounded-lg bg-white p-5 ring-1 ring-gray-200">
          <NovoPedidoForm
            onCriado={() => {
              setCriando(false);
              void carregar();
            }}
          />
        </div>
      )}

      {aviso && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-brand/30 bg-brand-soft/40 p-3 text-sm text-brand-strong">
          <span>{aviso}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            className="shrink-0 font-medium underline underline-offset-2"
          >
            ok
          </button>
        </div>
      )}

      {erro ? (
        <div className="mt-8 rounded-lg border border-status-critico/30 bg-status-critico/5 p-4 text-sm text-status-critico">
          {erro}
          <button
            type="button"
            onClick={() => void carregar()}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Tentar de novo
          </button>
        </div>
      ) : carregando ? (
        <p className="mt-8 text-sm text-gray-400">Carregando pedidos…</p>
      ) : pedidos.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
          Nenhum pedido ainda. Crie o primeiro com “Novo pedido”.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="w-10 px-4 py-3" aria-label="Expandir" />
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Itens</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.map((p) => {
                const aberto = expandidoId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandidoId((atual) => (atual === p.id ? null : p.id))}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-gray-400 transition-transform ${aberto ? "rotate-90" : ""}`}
                        >
                          ▶
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.id}</td>
                      <td className="px-4 py-3 text-gray-600">{formatarData(p.dataCriacao)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                        {p.itens.length}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classeBadgePedido(p.status)}`}
                        >
                          {rotuloPedido(p.status)}
                        </span>
                      </td>
                    </tr>
                    {aberto && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50/60 px-4 py-4">
                          <p className="mb-3 text-sm text-gray-600">
                            <span className="font-medium">Justificativa:</span> {p.justificativa}
                          </p>
                          <DetalheItens
                            itens={p.itens}
                            {...(podeProcessar
                              ? {
                                  onExpedir: (itemId: number) => void aoExpedir(p.id, itemId),
                                  expedindoId,
                                }
                              : {})}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
