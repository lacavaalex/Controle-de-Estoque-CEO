// =============================================================================
// Solicitações / Pedidos (EP04) — cria pedidos multi-item e acompanha o
// processamento. Lista os pedidos do setor do usuário (origem OU destino, RN12)
// e permite criar um novo (NovoPedidoForm).
//
// Fonte: GET /setores/:setorId/pedidos (lista) + POST /pedidos (criar). Usa o
// setorId da própria identidade.
// =============================================================================
import { Fragment, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { pedidosDoSetor } from "@/api/pedidos";
import { ApiError } from "@/api/client";
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

function DetalheItens({ itens }: { itens: ItemDoPedido[] }) {
  if (itens.length === 0) {
    return <p className="text-sm text-gray-400">Sem itens.</p>;
  }
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

  const [pedidos, setPedidos] = useState<PedidoComItens[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

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
                          <DetalheItens itens={p.itens} />
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
