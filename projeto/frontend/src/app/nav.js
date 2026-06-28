// nav.js — itens de navegação e visibilidade por perfil.
// Mantém a regra de "perfil molda a navegação" num só lugar.
import { PERFIL } from "../api/constants.js";

const { GESTOR, ALMOXARIFE, SOLICITANTE } = PERFIL;

// to: rota · label · icon (emoji simples; trocável por SVG depois) · perfis que veem
export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊", perfis: [GESTOR, ALMOXARIFE, SOLICITANTE] },
  { to: "/estoque",   label: "Estoque",   icon: "📦", perfis: [GESTOR, ALMOXARIFE, SOLICITANTE] },
  { to: "/pedidos/novo", label: "Novo pedido", icon: "➕", perfis: [GESTOR, SOLICITANTE] },
  { to: "/pedidos",   label: "Processar pedidos", icon: "🗂️", perfis: [GESTOR, ALMOXARIFE] },
  // Triagem do Agente de Email (EP08): mesmo escopo de quem processa pedidos.
  { to: "/triagem",   label: "Triagem", icon: "📨", perfis: [GESTOR, ALMOXARIFE] },
  { to: "/movimentacoes", label: "Movimentações", icon: "🔁", perfis: [GESTOR, ALMOXARIFE] },
  { to: "/usuarios",  label: "Usuários",  icon: "👥", perfis: [GESTOR] },
];

export function navParaPerfil(perfil) {
  return NAV_ITEMS.filter((i) => i.perfis.includes(perfil));
}

// Rótulo amigável do perfil para o cabeçalho.
export const ROTULO_PERFIL = {
  gestor: "Gestor",
  almoxarife: "Almoxarife",
  solicitante: "Solicitante",
  dentista: "Dentista",
};
