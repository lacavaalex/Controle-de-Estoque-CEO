// Cálculos de estoque sobre o modelo Produto × Lote, sem I/O.
// Regras: RN03/RN04 (crítico/baixo/excessivo), RN05 (validade do lote),
// RN06 (precedência do status agregado), RN07 (soma de lotes ativos),
// RN17 (estado do lote), RN20 (ordenação FEFO), RN02 (equipamento sem status).
import type { Lote, Produto } from "../entities/index.js";

// Status agregado do produto (RN06)
export type StatusProduto =
  | "indisponivel"
  | "vencido"
  | "vencendo"
  | "atencao"
  | "critico"
  | "baixo"
  | "excessivo"
  | "normal";

// Estado de validade de um lote (RN05)
export type EstadoValidade = "vencido" | "vencendo" | "atencao" | "ok";

const MS_POR_DIA = 86_400_000;

/** Dias (inteiros, floor) entre hoje e a validade. Negativo = já venceu. */
export function diasParaVencer(validade: string | Date, hoje: Date = new Date()): number {
  const dataValidade = typeof validade === "string" ? new Date(validade) : validade;
  // Normaliza para o início do dia para evitar viés por hora.
  const v = Date.UTC(dataValidade.getUTCFullYear(), dataValidade.getUTCMonth(), dataValidade.getUTCDate());
  const h = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  return Math.floor((v - h) / MS_POR_DIA);
}

/**
 * RN05 — estado de validade de um lote em relação a hoje:
 *   dias <= 0  -> vencido
 *   0 < dias <= 30 -> vencendo
 *   30 < dias <= 60 -> atencao
 *   senão -> ok
 */
export function estadoValidadeLote(lote: Lote, hoje: Date = new Date()): EstadoValidade {
  const dias = diasParaVencer(lote.validade, hoje);
  if (dias <= 0) return "vencido";
  if (dias <= 30) return "vencendo";
  if (dias <= 60) return "atencao";
  return "ok";
}

/** Um lote conta para o estoque ativo? RN07: só estado 'ativo'. */
export function loteEhAtivo(lote: Lote): boolean {
  return lote.estado === "ativo";
}

/**
 * RN07 — qtd_total de um produto num conjunto de lotes (já filtrados por
 * produto+setor pelo chamador): soma das quantidades dos lotes ATIVOS.
 * Lotes vencidos e segregados não entram.
 */
export function qtdTotal(lotes: Lote[]): number {
  return lotes.filter(loteEhAtivo).reduce((acc, l) => acc + l.quantidade, 0);
}

/**
 * INV08 / RN20 — um lote é expedível se está ativo e tem saldo.
 * (Vencido/segregado nunca é expedível; aqui também exigimos quantidade > 0.)
 */
export function loteEhExpedivel(lote: Lote, hoje: Date = new Date()): boolean {
  return (
    lote.estado === "ativo" &&
    lote.quantidade > 0 &&
    estadoValidadeLote(lote, hoje) !== "vencido"
  );
}

/**
 * RN20 — FEFO (First Expired, First Out): ordena lotes expedíveis pela validade
 * mais próxima primeiro. Não muta a entrada. Lotes não-expedíveis são removidos.
 */
export function ordenarFEFO(lotes: Lote[], hoje: Date = new Date()): Lote[] {
  return lotes
    .filter((l) => loteEhExpedivel(l, hoje))
    .slice()
    .sort((a, b) => diasParaVencer(a.validade, hoje) - diasParaVencer(b.validade, hoje));
}

/** Categoria isenta da lógica de status de quantidade (RN02). */
function isentaDeQuantidade(produto: Produto): boolean {
  return produto.categoria === "Equipamento";
}

/**
 * RN03–RN06 — status agregado do produto, dado seus lotes (já filtrados por
 * produto+setor). `incluirExcessivo` liga a regra RN04 (só HO).
 *
 * Precedência (RN06): indisponível > vencido > vencendo > atenção > crítico >
 * baixo > excessivo > normal. O componente de validade considera apenas lotes
 * ATIVOS.
 */
export function statusProduto(
  produto: Produto,
  lotes: Lote[],
  opcoes: { incluirExcessivo?: boolean; hoje?: Date } = {},
): StatusProduto {
  const hoje = opcoes.hoje ?? new Date();
  const incluirExcessivo = opcoes.incluirExcessivo ?? true;

  const total = qtdTotal(lotes);
  const ativos = lotes.filter(loteEhAtivo);

  // 1. Indisponível (RN06.1) — vale mesmo para Equipamento.
  if (total === 0) return "indisponivel";

  // Componente de validade sobre os lotes ativos (RN05/RN06.2–4).
  const estados = ativos.map((l) => estadoValidadeLote(l, hoje));
  if (estados.includes("vencido")) return "vencido";
  if (estados.includes("vencendo")) return "vencendo";
  if (estados.includes("atencao")) return "atencao";

  // Equipamento (RN02): não entra em crítico/baixo/excessivo.
  if (isentaDeQuantidade(produto)) return "normal";

  // 5–7. Quantidade (RN03/RN04).
  if (total <= produto.estoqueMinimo) return "critico";
  if (total <= produto.estoqueMinimo * 1.5) return "baixo";
  if (incluirExcessivo && total >= produto.estoqueMaximo * 0.95) return "excessivo";

  return "normal";
}

/** Rótulos PT-BR para UI. */
export function rotuloStatus(status: StatusProduto): string {
  const labels: Record<StatusProduto, string> = {
    indisponivel: "Indisponível",
    vencido: "Vencido",
    vencendo: "Vencendo",
    atencao: "Atenção",
    critico: "Crítico",
    baixo: "Baixo",
    excessivo: "Excessivo",
    normal: "Normal",
  };
  return labels[status];
}

// CEO-250 — Listas de alerta "vencendo / crítico"
//
// O alerta que justifica o sistema: a partir do status agregado de cada produto
// (já calculado por statusProduto), separa o que exige AÇÃO em dois grupos:
//
//  - reposição : produto sem saldo ou com saldo abaixo do mínimo (indisponivel,
//                critico, baixo) — RN03. O gestor precisa repor/pedir.
//  - vencimento: produto com algum lote ATIVO vencido/perto de vencer
//                (vencido, vencendo, atencao) — RN05. Exige segregar/expedir antes.
//
// São funções puras (sem I/O): recebem o agregado já pronto e classificam.

/** Status que indicam necessidade de REPOSIÇÃO (saldo insuficiente — RN03). */
const STATUS_REPOSICAO: ReadonlySet<StatusProduto> = new Set([
  "indisponivel",
  "critico",
  "baixo",
]);

/** Status que indicam alerta de VALIDADE (lote ativo vencendo/vencido — RN05). */
const STATUS_VENCIMENTO: ReadonlySet<StatusProduto> = new Set([
  "vencido",
  "vencendo",
  "atencao",
]);

/** Um produto exige reposição? (indisponível / crítico / baixo) */
export function exigeReposicao(status: StatusProduto): boolean {
  return STATUS_REPOSICAO.has(status);
}

/** Um produto tem alerta de validade? (vencido / vencendo / atenção) */
export function exigeAtencaoValidade(status: StatusProduto): boolean {
  return STATUS_VENCIMENTO.has(status);
}

/**
 * Ordem de severidade para ordenar as listas de alerta — o mais urgente vem
 * primeiro. Status fora das listas de alerta recebem prioridade baixa.
 */
const SEVERIDADE: Record<StatusProduto, number> = {
  indisponivel: 0,
  vencido: 1,
  vencendo: 2,
  critico: 3,
  baixo: 4,
  atencao: 5,
  excessivo: 6,
  normal: 7,
};

/** Compara dois status pela severidade (para sort): menor número = mais urgente. */
export function compararSeveridade(a: StatusProduto, b: StatusProduto): number {
  return SEVERIDADE[a] - SEVERIDADE[b];
}
