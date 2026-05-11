import type { Item } from "../entities/Item.js";
import type { EstoqueCeo } from "../entities/EstoqueCeo.js";
import type {
  StatusItemDispensacao,
  StatusEstoqueCeo,
} from "../entities/enums.js";

export function calcularStatusItemDispensacao(
  item: Pick<Item, "quantidade" | "estoque_minimo" | "estoque_maximo" | "validade">,
  hoje: Date = new Date()
): StatusItemDispensacao {
  const [ano, mes, dia] = item.validade.split("-").map(Number) as [number, number, number];
  const validadeDate = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  const hojeNorm = new Date(hoje);
  hojeNorm.setHours(0, 0, 0, 0);

  const diasParaVencer = Math.floor(
    (validadeDate.getTime() - hojeNorm.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diasParaVencer <= 0) return "Vencido";
  if (diasParaVencer <= 30) return "Vencendo";
  if (diasParaVencer <= 60) return "Atenção";
  if (item.quantidade <= item.estoque_minimo) return "Crítico";
  if (item.quantidade <= item.estoque_minimo * 1.5) return "Baixo";
  if (item.quantidade >= item.estoque_maximo * 0.95) return "Excessivo";
  return "Normal";
}

export function calcularStatusEstoqueCeo(
  estoque: Pick<EstoqueCeo, "quantidade" | "estoque_minimo">
): StatusEstoqueCeo {
  if (estoque.quantidade === 0) return "Indisponível";
  if (estoque.quantidade <= estoque.estoque_minimo) return "Crítico";
  if (estoque.quantidade <= estoque.estoque_minimo * 2) return "Baixo";
  return "Disponível";
}
