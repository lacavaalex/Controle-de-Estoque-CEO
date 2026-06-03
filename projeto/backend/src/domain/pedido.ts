// =============================================================================
// Função de domínio — status DERIVADO do pedido a partir dos seus itens (RN10).
// Pura e testável. O status do pedido nunca é setado à mão: é calculado.
// =============================================================================
import type { Lote, MotivoDivergencia, StatusItem, StatusPedido } from "../entities/index.js";
import { ordenarFEFO } from "./estoque.js";

/**
 * RN10 — deriva o status do pedido a partir dos status dos seus itens.
 *
 *  - pendente            : todos pendente (ou mistura pendente + aguardando_reposicao).
 *  - aguardando_reposicao: todos os (pendentes) estão em aguardando_reposicao.
 *  - em_processamento    : algum item já processado, mas ainda existe pendente.
 *  - atendido_integral   : todos atendido_integral.
 *  - nao_atendido        : todos nao_atendido ou aguardando_reposicao (nada saiu).
 *  - atendido_parcial    : todos processados, com ao menos um parcial/não-atendido
 *                          e ao menos um atendido (integral ou parcial).
 *
 * Lança erro se a lista estiver vazia (RN09: pedido tem >= 1 item).
 */
export function statusDerivadoDoPedido(statusItens: StatusItem[]): StatusPedido {
  if (statusItens.length === 0) {
    throw new Error("Pedido deve ter ao menos um item (RN09)");
  }

  const conta = (s: StatusItem) => statusItens.filter((x) => x === s).length;
  const total = statusItens.length;

  const pendentes = conta("pendente");
  const aguardando = conta("aguardando_reposicao");
  const integrais = conta("atendido_integral");
  const parciais = conta("atendido_parcial");
  const naoAtendidos = conta("nao_atendido");

  const algumAtendido = integrais > 0 || parciais > 0;

  // RN10 — avaliado por precedência, na ordem do documento de regras:

  // 1. atendido_integral — todos integral.
  if (integrais === total) return "atendido_integral";

  // 2. em_processamento — algum item já saiu (parcial/integral) mas ainda há
  //    itens PENDENTES (ainda processáveis). aguardando_reposicao NÃO conta como
  //    pendente aqui (é demanda represada, não fila de processamento).
  if (algumAtendido && pendentes > 0) return "em_processamento";

  // 3. atendido_parcial — tudo já decidido (sem pendentes), com ao menos um
  //    atendido e ao menos um parcial/não-atendido.
  if (algumAtendido && pendentes === 0) return "atendido_parcial";

  // A partir daqui, NADA foi atendido (integrais = parciais = 0).

  // 4. nao_atendido — todos nao_atendido ou aguardando_reposicao, com ao menos
  //    um nao_atendido (foi processado e recusado; nada saiu).
  if (naoAtendidos > 0 && pendentes === 0) return "nao_atendido";

  // 5. aguardando_reposicao — só itens aguardando reposição (sem pendentes).
  if (aguardando === total) return "aguardando_reposicao";

  // 6. em_processamento — há nao_atendido (já processado) mas ainda há pendentes.
  if (naoAtendidos > 0 && pendentes > 0) return "em_processamento";

  // 7. pendente — restante: só pendentes, ou mistura pendente + aguardando.
  return "pendente";
}

// =============================================================================
// Expedição de um item (RN16/RN19/RN20) — PURO, sem I/O.
// Dado quanto se pede e os lotes disponíveis no setor de origem (HO), calcula:
//   - como repartir a quantidade entre lotes (FEFO, RN20);
//   - quanto sai no total (qtdExpedida);
//   - o status do item resultante (RN10) e, se houver divergência, o motivo (RN16).
// O service consome este plano para fazer as baixas e movimentações na transação.
// =============================================================================

/** Uma alocação concreta: tirar `quantidade` do lote `loteId`. */
export interface AlocacaoLote {
  loteId: number;
  quantidade: number;
}

export interface PlanoExpedicao {
  alocacoes: AlocacaoLote[];
  qtdExpedida: number;
  qtdSolicitada: number;
  statusItem: StatusItem;
  // Só presente quando qtdExpedida < qtdSolicitada (INV03/RN16).
  motivoDivergencia?: MotivoDivergencia;
}

/**
 * RN16/RN19/RN20 — planeja a expedição de um item.
 *
 * Consome os lotes expedíveis do produto no setor de origem na ordem FEFO
 * (validade mais próxima primeiro) até cobrir `qtdSolicitada` ou esgotar o
 * estoque ativo. Não muta `lotesDisponiveis`.
 *
 *   - qtdExpedida == solicitada            -> atendido_integral (sem motivo).
 *   - 0 < qtdExpedida < solicitada         -> atendido_parcial  (falta_estoque).
 *   - qtdExpedida == 0 (sem lote ativo)    -> aguardando_reposicao (falta_estoque).
 *
 * `qtdSolicitada` deve ser >= 1 (RN09); lança erro caso contrário.
 */
export function planejarExpedicaoItem(
  qtdSolicitada: number,
  lotesDisponiveis: Lote[],
  hoje: Date = new Date(),
): PlanoExpedicao {
  if (qtdSolicitada < 1) {
    throw new Error("Quantidade solicitada deve ser >= 1 (RN09)");
  }

  // RN20 — só lotes expedíveis (ativos, com saldo, não vencidos), em ordem FEFO.
  const fila = ordenarFEFO(lotesDisponiveis, hoje);

  const alocacoes: AlocacaoLote[] = [];
  let restante = qtdSolicitada;
  for (const lote of fila) {
    if (restante <= 0) break;
    const tirar = Math.min(lote.quantidade, restante);
    if (tirar > 0) {
      alocacoes.push({ loteId: lote.id, quantidade: tirar });
      restante -= tirar;
    }
  }

  const qtdExpedida = qtdSolicitada - restante;

  let statusItem: StatusItem;
  let motivoDivergencia: MotivoDivergencia | undefined;
  if (qtdExpedida === qtdSolicitada) {
    statusItem = "atendido_integral";
  } else if (qtdExpedida === 0) {
    // Nada saiu: demanda represada até repor estoque.
    statusItem = "aguardando_reposicao";
    motivoDivergencia = "falta_estoque";
  } else {
    statusItem = "atendido_parcial";
    motivoDivergencia = "falta_estoque";
  }

  return {
    alocacoes,
    qtdExpedida,
    qtdSolicitada,
    statusItem,
    ...(motivoDivergencia !== undefined ? { motivoDivergencia } : {}),
  };
}
