// tokens.js — acesso em runtime aos design tokens (custom properties do theme.css).

// Resolve o valor de um design token. Útil onde uma lib precisa de uma cor
// concreta (ex.: recharts não aceita var() no fill das barras). Retorna
// `fallback` quando não há CSS computado disponível (SSR / jsdom nos testes) ou
// o token não está definido.
export function tokenColor(nome, fallback) {
  if (typeof window === "undefined" || !window.getComputedStyle) return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return v || fallback;
}
