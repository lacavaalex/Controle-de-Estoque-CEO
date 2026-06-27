// Função de domínio — status DERIVADO do pedido a partir dos seus itens (RN10).
// Pura e testável. O status do pedido nunca é setado à mão: é calculado.
import type { StatusItem, StatusPedido, Unidade } from "../entities/index.js";
import type { Lote, MotivoDivergencia } from "../entities/index.js";
import { ordenarFEFO } from "./estoque.js";

// Validação dos itens de um pedido novo (RN09 + INV07) — pura, sem I/O.
// Fonte única usada tanto pela criação direta (PedidoService.criar) quanto pela
// promoção de rascunho (RascunhoService.promover): ambas têm que gerar itens que
// respeitam o XOR produto/descrição e qtd>=1 ANTES de chegar ao banco.

// Item como entra (do solicitante ou da triagem): XOR entre produtoId e
// descricaoLivre; quantidade e unidade obrigatórias.
export interface ItemEntrada {
  produtoId?: number | null;
  descricaoLivre?: string | null;
  qtdSolicitada: number;
  unidade: Unidade;
}

// Item validado e normalizado, pronto para o insert (status nasce 'pendente').
export interface ItemValidado {
  produtoId?: number;
  descricaoLivre?: string;
  qtdSolicitada: number;
  unidade: Unidade;
  statusItem: StatusItem;
}

/**
 * RN09/INV07 — valida e normaliza os itens de um pedido novo. Lança erro
 * descritivo (com o índice do item) na primeira violação. Não faz I/O.
 */
export function validarItensNovoPedido(itens: ItemEntrada[]): ItemValidado[] {
  // Valida o formato antes do .map para responder 400, não 500.
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Pedido deve ter ao menos um item (RN09)");
  }
  return itens.map((i, idx) => {
    const temProduto = i.produtoId !== undefined && i.produtoId !== null;
    const temDescricao =
      i.descricaoLivre !== undefined &&
      i.descricaoLivre !== null &&
      i.descricaoLivre.trim() !== "";
    // INV07 — XOR entre produtoId e descricaoLivre (exatamente um).
    if (temProduto === temDescricao) {
      throw new Error(
        `Item ${idx + 1}: informe produtoId OU descricaoLivre (exatamente um) — INV07`,
      );
    }
    // Number.isInteger barra NaN, strings e floats.
    if (!Number.isInteger(i.qtdSolicitada) || i.qtdSolicitada < 1) {
      throw new Error(`Item ${idx + 1}: quantidade solicitada deve ser >= 1 (RN09)`);
    }
    return {
      ...(temProduto ? { produtoId: i.produtoId as number } : { descricaoLivre: i.descricaoLivre as string }),
      qtdSolicitada: i.qtdSolicitada,
      unidade: i.unidade,
      statusItem: "pendente" as StatusItem,
    };
  });
}

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

// Expedição de um item (RN16/RN19/RN20) — puro, sem I/O.
// Dado quanto se pede e os lotes disponíveis no setor de origem (HO), calcula:
//   - como repartir a quantidade entre lotes (FEFO, RN20);
//   - quanto sai no total (qtdExpedida);
//   - o status do item resultante (RN10) e, se houver divergência, o motivo (RN16).
// O service consome este plano para fazer as baixas e movimentações na transação.

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

// Direção física das movimentações de uma expedição (RN19/INV09) — puro.
//
// Atenção ao duplo sentido de "origem/destino" no domínio:
//  - No PEDIDO, origem/destino = direção da REQUISIÇÃO:
//      setorOrigemId  = setor que SOLICITA (ex.: CEO)   [modelo conceitual 2.5]
//      setorDestinoId = almoxarifado HO (sempre HO no MVP)
//  - Na MOVIMENTAÇÃO, origem/destino = direção física dos BENS, que fluem ao
//    contrário: saem do HO e entram no CEO. Por isso a expedição lê os lotes do
//    HO (= pedido.setorDestinoId) e gera saída@HO + entrada@CEO.

export interface DirecaoExpedicao {
  /** De onde os bens saem fisicamente: o almoxarifado HO. */
  setorHoId: number;
  /** Para onde os bens vão: o setor solicitante (CEO). */
  setorCeoId: number;
}

/** RN19/INV09 — inverte a direção do pedido para a direção física dos bens. */
export function direcaoExpedicao(pedido: {
  setorOrigemId: number;
  setorDestinoId: number;
}): DirecaoExpedicao {
  return { setorHoId: pedido.setorDestinoId, setorCeoId: pedido.setorOrigemId };
}

// Segunda perna do RN19/INV09 — planeja a ENTRADA no CEO a partir das baixas
// feitas no HO. Para cada alocação (saída de um lote-HO), decide se soma num
// lote-CEO já existente (mesmo numeroLote + produto) ou cria um novo lote-CEO
// copiando numeroLote/fabricacao/validade do lote-HO. puro e testável.

/** Uma perna de entrada no CEO derivada de uma baixa no HO. */
export interface EntradaCeoLeg {
  /** Lote-HO de onde os bens saíram (origem dos metadados copiados). */
  loteHoId: number;
  numeroLote: string;
  fabricacao: string | null;
  validade: string;
  quantidade: number; // positivo
  // Quando há lote-CEO com mesmo numeroLote+produto: soma nele; senão cria novo.
  loteCeoExistenteId: number | null;
}

/**
 * RN19/INV09 — dado o plano de baixas no HO (`alocacoes`), os lotes-HO (para
 * resolver numeroLote/fab/validade de cada loteId) e os lotes-CEO existentes,
 * produz as pernas de entrada no CEO. Não faz I/O nem muta as entradas.
 */
export function planejarEntradaCeo(
  alocacoes: AlocacaoLote[],
  lotesHo: Lote[],
  lotesCeo: Lote[],
): EntradaCeoLeg[] {
  return alocacoes.map((aloc) => {
    const loteHo = lotesHo.find((l) => l.id === aloc.loteId);
    if (!loteHo) {
      throw new Error(`Lote-HO ${aloc.loteId} não encontrado ao planejar entrada-CEO`);
    }
    const loteCeo = lotesCeo.find(
      (l) => l.numeroLote === loteHo.numeroLote && l.produtoId === loteHo.produtoId,
    );
    return {
      loteHoId: loteHo.id,
      numeroLote: loteHo.numeroLote,
      fabricacao: loteHo.fabricacao,
      validade: loteHo.validade,
      quantidade: aloc.quantidade,
      loteCeoExistenteId: loteCeo ? loteCeo.id : null,
    };
  });
}
