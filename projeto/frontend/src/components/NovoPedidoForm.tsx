// =============================================================================
// NovoPedidoForm — formulário de criação de pedido multi-item (EP04-01 / RN09).
//
// Regras (espelham PedidoService.criar):
//   • justificativa >= 10 caracteres (RN09).
//   • >= 1 item; cada item tem qtd >= 1 e (produto do catálogo XOR descrição
//     livre) — INV07.
//   • origem (HO/almoxarifado) != destino (setor do solicitante).
//
// origem/destino vêm de GET /setores: destino = setor do próprio solicitante;
// origem = o setor do tipo 'almoxarifado' (HO). Os produtos vêm do catálogo do
// HO (GET /setores/:ho/catalogo).
// =============================================================================
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { listarSetores } from "@/api/setores";
import { catalogoDoSetor, type CatalogoItem } from "@/api/estoque";
import { criarPedido } from "@/api/pedidos";
import { ApiError } from "@/api/client";
import type { ItemNovoPedido, Setor, Unidade } from "@/types/domain";

const UNIDADES: Unidade[] = [
  "caixa",
  "tubo",
  "seringa",
  "kit",
  "pacote",
  "rolo",
  "unidade",
  "frasco",
  "bastão",
  "folha",
  "par",
];

// Item em edição no formulário. `produtoId` vazio = descrição livre.
interface LinhaForm {
  produtoId: string; // "" quando descrição livre
  descricaoLivre: string;
  qtdSolicitada: string;
  unidade: Unidade;
}

function linhaVazia(): LinhaForm {
  return { produtoId: "", descricaoLivre: "", qtdSolicitada: "1", unidade: "unidade" };
}

interface NovoPedidoFormProps {
  onCriado: () => void;
}

export function NovoPedidoForm({ onCriado }: NovoPedidoFormProps) {
  const { identidade } = useAuth();
  const meuSetorId = identidade?.setorId ?? null;

  const [setores, setSetores] = useState<Setor[] | null>(null);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [erroSetup, setErroSetup] = useState<string | null>(null);

  const [justificativa, setJustificativa] = useState("");
  const [linhas, setLinhas] = useState<LinhaForm[]>([linhaVazia()]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Setup: descobre o HO (origem) via /setores e carrega o catálogo do PRÓPRIO
  // setor do solicitante (RN12/podeVerSetor só libera o próprio setor — pedir o
  // catálogo do HO daria 403). Degradação suave se /setores indisponível.
  useEffect(() => {
    if (meuSetorId === null) return;
    let ativo = true;
    Promise.all([listarSetores(), catalogoDoSetor(meuSetorId)])
      .then(([todos, cat]) => {
        if (!ativo) return;
        setSetores(todos);
        setCatalogo(cat);
      })
      .catch((err) => {
        if (ativo) {
          setErroSetup(
            err instanceof ApiError
              ? `Não foi possível preparar o formulário: ${err.message}`
              : "Não foi possível preparar o formulário.",
          );
        }
      });
    return () => {
      ativo = false;
    };
  }, [meuSetorId]);

  // Orientação do backend (podeCriarPedido): ORIGEM = setor do solicitante
  // (quem pede), DESTINO = o HO/almoxarifado (quem fornece e processa). A
  // expedição depois move o estoque HO -> setor de origem.
  const origem = setores?.find((s) => s.id === meuSetorId) ?? null;
  const ho = setores?.find((s) => s.tipo === "almoxarifado") ?? null;

  function atualizarLinha(idx: number, patch: Partial<LinhaForm>) {
    setLinhas((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function adicionarLinha() {
    setLinhas((ls) => [...ls, linhaVazia()]);
  }

  function removerLinha(idx: number) {
    setLinhas((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (justificativa.trim().length < 10) {
      setErro("A justificativa deve ter ao menos 10 caracteres.");
      return;
    }
    if (!origem || !ho) {
      setErro("Setores de origem/destino indisponíveis.");
      return;
    }

    const itens: ItemNovoPedido[] = [];
    for (const [i, l] of linhas.entries()) {
      const qtd = Number(l.qtdSolicitada);
      if (!Number.isInteger(qtd) || qtd < 1) {
        setErro(`Item ${i + 1}: quantidade deve ser um inteiro >= 1.`);
        return;
      }
      const temProduto = l.produtoId !== "";
      const temDescricao = l.descricaoLivre.trim() !== "";
      if (temProduto === temDescricao) {
        setErro(`Item ${i + 1}: escolha um produto OU descreva o item (apenas um).`);
        return;
      }
      itens.push(
        temProduto
          ? { produtoId: Number(l.produtoId), qtdSolicitada: qtd, unidade: l.unidade }
          : { descricaoLivre: l.descricaoLivre.trim(), qtdSolicitada: qtd, unidade: l.unidade },
      );
    }

    setEnviando(true);
    try {
      await criarPedido({
        setorOrigemId: origem.id,
        setorDestinoId: ho.id,
        justificativa: justificativa.trim(),
        itens,
      });
      // Reseta e avisa o pai para recarregar a lista.
      setJustificativa("");
      setLinhas([linhaVazia()]);
      onCriado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Falha ao criar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  if (erroSetup) {
    return (
      <div className="rounded-lg border border-status-atencao/40 bg-status-atencao/5 p-4 text-sm text-gray-700">
        {erroSetup}
      </div>
    );
  }
  if (setores === null) {
    return <p className="text-sm text-gray-400">Preparando formulário…</p>;
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-5">
      <div>
        <label htmlFor="justificativa" className="block text-sm font-medium text-gray-700">
          Justificativa <span className="text-gray-400">(mín. 10 caracteres)</span>
        </label>
        <textarea
          id="justificativa"
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
          placeholder="Motivo da solicitação…"
        />
      </div>

      <div className="space-y-3">
        <span className="block text-sm font-medium text-gray-700">Itens</span>
        {linhas.map((l, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-end gap-2 rounded-md border border-gray-200 p-3"
          >
            <div className="min-w-48 flex-1">
              <label className="block text-xs text-gray-500">Produto do catálogo</label>
              <select
                value={l.produtoId}
                onChange={(e) =>
                  atualizarLinha(idx, {
                    produtoId: e.target.value,
                    // Selecionar produto limpa a descrição livre (XOR).
                    ...(e.target.value !== "" ? { descricaoLivre: "" } : {}),
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              >
                <option value="">— ou descreva abaixo —</option>
                {catalogo.map((p) => (
                  <option key={p.produtoId} value={p.produtoId}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-48 flex-1">
              <label className="block text-xs text-gray-500">Descrição livre</label>
              <input
                type="text"
                value={l.descricaoLivre}
                disabled={l.produtoId !== ""}
                onChange={(e) => atualizarLinha(idx, { descricaoLivre: e.target.value })}
                placeholder="Item fora do catálogo"
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none disabled:bg-gray-100"
              />
            </div>

            <div className="w-20">
              <label className="block text-xs text-gray-500">Qtd.</label>
              <input
                type="number"
                min={1}
                step={1}
                value={l.qtdSolicitada}
                onChange={(e) => atualizarLinha(idx, { qtdSolicitada: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            <div className="w-28">
              <label className="block text-xs text-gray-500">Unidade</label>
              <select
                value={l.unidade}
                onChange={(e) => atualizarLinha(idx, { unidade: e.target.value as Unidade })}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => removerLinha(idx)}
              disabled={linhas.length === 1}
              className="rounded-md px-2 py-2 text-sm text-gray-400 hover:text-status-critico disabled:opacity-40"
              aria-label={`Remover item ${idx + 1}`}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={adicionarLinha}
          className="text-sm font-medium text-brand hover:text-brand-strong"
        >
          + Adicionar item
        </button>
      </div>

      {erro && <p className="text-sm text-status-critico">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Criar pedido"}
      </button>
    </form>
  );
}
