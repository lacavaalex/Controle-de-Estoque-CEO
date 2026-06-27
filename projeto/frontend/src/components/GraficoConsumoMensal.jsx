// GraficoConsumoMensal — gráfico de barras de consumo mensal por setor (CEO-249/253).
// Recebe { meses: string[], setores: [{ nome, valores: number[] }] } do backend e
// transforma no formato por-linha que o recharts espera.
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { EmptyState } from "../app/ui.jsx";

// Paleta de marca: bordô UFPE + tons de status do design system.
const CORES = ["#990000", "#0b5cad", "#0a7d33", "#b35900"];

// "2026-05" → "mai/26" para rótulo curto no eixo X.
const MESES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function rotuloMes(iso) {
  const [ano, mes] = iso.split("-");
  const i = Number(mes) - 1;
  return `${MESES_PT[i] ?? mes}/${ano.slice(2)}`;
}

// { meses, setores } → [{ mes: "mai/26", CEO: 10, CME: 0, ... }, ...]
function paraLinhas(meses, setores) {
  return meses.map((mes, idx) => {
    const linha = { mes: rotuloMes(mes) };
    for (const s of setores) linha[s.nome] = s.valores[idx] ?? 0;
    return linha;
  });
}

export default function GraficoConsumoMensal({ dados }) {
  const meses = dados?.meses ?? [];
  const setores = dados?.setores ?? [];

  const semDados =
    !meses.length ||
    !setores.length ||
    setores.every((s) => (s.valores ?? []).every((v) => !v));

  if (semDados) {
    return (
      <div className="panel">
        <EmptyState title="Sem consumo no período">
          Nenhuma saída registrada para os setores no intervalo selecionado.
        </EmptyState>
      </div>
    );
  }

  const linhas = paraLinhas(meses, setores);

  return (
    <div className="panel" style={{ padding: "var(--sp-4)" }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={linhas} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="var(--ink-3)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--ink-3)" />
          <Tooltip
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--line)" }}
            cursor={{ fill: "var(--surface-2)" }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          {setores.map((s, i) => (
            <Bar key={s.nome} dataKey={s.nome} fill={CORES[i % CORES.length]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
