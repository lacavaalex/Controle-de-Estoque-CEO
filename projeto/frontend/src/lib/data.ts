// Formatação de datas para a UI. O backend manda dates como ISO "YYYY-MM-DD"
// (coluna Drizzle `date`). Formatamos em pt-BR sem deslocamento de fuso: a string
// "YYYY-MM-DD" é interpretada como meia-noite UTC, então lemos os componentes UTC.

const FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-05-30" -> "30/05/2026". Para data nula, devolve "—". */
export function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return FMT.format(d);
}
