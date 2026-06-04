// =============================================================================
// TabelaEstoque — tabela de estoque agregado (produto, categoria, qtd, mínimo,
// unidade, status). Compartilhada pela tela Estoque CEO e Estoque Dispensação.
//
// Quando `renderDetalhe` é fornecido, cada linha ganha um botão de expandir que
// revela um detalhe (no HO: os lotes do produto). Sem ele, a tabela é simples
// (caso CEO). Uma única linha pode ficar expandida por vez.
// =============================================================================
import { Fragment, useState, type ReactNode } from "react";
import { classeBadgeStatus, rotuloStatus } from "@/lib/status";
import type { ProdutoComEstoque, StatusProduto } from "@/types/domain";

function StatusBadge({ status }: { status: StatusProduto }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classeBadgeStatus(status)}`}
    >
      {rotuloStatus(status)}
    </span>
  );
}

interface TabelaEstoqueProps {
  linhas: ProdutoComEstoque[];
  /** Se presente, habilita linhas expansíveis com este conteúdo de detalhe. */
  renderDetalhe?: (produto: ProdutoComEstoque) => ReactNode;
}

export function TabelaEstoque({ linhas, renderDetalhe }: TabelaEstoqueProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const expansivel = renderDetalhe !== undefined;
  const colSpan = expansivel ? 7 : 6;

  function alternar(produtoId: number) {
    setExpandidoId((atual) => (atual === produtoId ? null : produtoId));
  }

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
          <tr>
            {expansivel && <th className="w-10 px-4 py-3" aria-label="Expandir" />}
            <th className="px-4 py-3">Produto</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3 text-right">Qtd.</th>
            <th className="px-4 py-3 text-right">Mínimo</th>
            <th className="px-4 py-3">Unidade</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {linhas.map((l) => {
            const aberto = expandidoId === l.produtoId;
            return (
              <Fragment key={l.produtoId}>
                <tr
                  className={`hover:bg-gray-50 ${expansivel ? "cursor-pointer" : ""}`}
                  onClick={expansivel ? () => alternar(l.produtoId) : undefined}
                >
                  {expansivel && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-expanded={aberto}
                        aria-label={aberto ? "Recolher lotes" : "Ver lotes"}
                        className="text-gray-400 transition-colors hover:text-brand"
                        onClick={(e) => {
                          e.stopPropagation();
                          alternar(l.produtoId);
                        }}
                      >
                        <span className={`inline-block transition-transform ${aberto ? "rotate-90" : ""}`}>
                          ▶
                        </span>
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">{l.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{l.categoria}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">{l.qtdTotal}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                    {l.estoqueMinimo}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.unidade}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                </tr>
                {expansivel && aberto && (
                  <tr>
                    <td colSpan={colSpan} className="bg-gray-50/60 px-4 py-4">
                      {renderDetalhe(l)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
