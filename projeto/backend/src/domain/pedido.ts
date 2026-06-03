// =============================================================================
// Função de domínio — status DERIVADO do pedido a partir dos seus itens (RN10).
// Pura e testável. O status do pedido nunca é setado à mão: é calculado.
// =============================================================================
import type { StatusItem, StatusPedido } from "../entities/index.js";

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
