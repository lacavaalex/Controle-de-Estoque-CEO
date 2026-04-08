import { useState, useEffect, useMemo } from "react";
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  AlertTriangle,
  ClipboardList,
  Activity,
  LogOut,
  CalendarClock,
  ShieldAlert,
  Layers,
  ChevronDown,
  ChevronUp,
  FlaskConical,
} from "lucide-react";

/** Configuração de Estilos e Fontes (Interface Visual) */
if (typeof document !== "undefined") {
  const tw = document.createElement("script");
  tw.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(tw);

  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(font);

  const style = document.createElement("style");
  style.textContent = `
    body { font-family: 'Syne', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    .fade-in { animation: fadeIn .3s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .pulse-warn { animation: pulseWarn 2s ease-in-out infinite; }
    @keyframes pulseWarn { 0%,100%{opacity:1} 50%{opacity:.7} }
    ::-webkit-scrollbar { width:6px; height:6px; }
    ::-webkit-scrollbar-track { background:#f1f5f9; }
    ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:9999px; }
  `;
  document.head.appendChild(style);
}

/** Funções Auxiliares (Datas e IDs) */
const obterDataHora = () => new Date().toLocaleString("pt-BR").slice(0, 16);
const obterDataHoje = () => new Date().toISOString().split("T")[0];
const gerarProximoId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1);

function calcularDiasParaVencer(dataIso) {
  if (!dataIso) return Infinity;
  const diferenca = new Date(dataIso + "T00:00:00") - new Date(obterDataHoje() + "T00:00:00");
  return Math.ceil(diferenca / 86400000);
}

function calcularSaldoTotal(produto) {
  return (produto.lotes || []).reduce((soma, lote) => soma + lote.qtd, 0);
}

function verificarStatusValidade(produto) {
  const lotes = produto.lotes || [];
  if (!lotes.length) return null;
  const diasMinimos = Math.min(...lotes.filter((l) => l.qtd > 0).map((l) => calcularDiasParaVencer(l.validade)));
  if (diasMinimos < 0) return "vencido";
  if (diasMinimos <= 30) return "alerta";
  return "ok";
}

/** Lógica FEFO: Consome os lotes priorizando os que vencem primeiro */
function aplicarFEFO(lotes, quantidadeNecessaria) {
  const lotesOrdenados = [...lotes].sort((a, b) =>
    new Date(a.validade) - new Date(b.validade)
  );
  let restante = quantidadeNecessaria;
  const consumidos = [];
  const atualizados = lotes.map((l) => ({ ...l }));

  for (const ref of lotesOrdenados) {
    if (restante <= 0) break;
    const index = atualizados.findIndex((l) => l.id === ref.id);
    const retirar = Math.min(atualizados[index].qtd, restante);
    if (retirar > 0) {
      consumidos.push({ codigoLote: atualizados[index].codigoLote, loteId: atualizados[index].id, qtd: retirar });
      atualizados[index] = { ...atualizados[index], qtd: atualizados[index].qtd - retirar };
      restante -= retirar;
    }
  }
  return { lotesAtualizados: atualizados.filter((l) => l.qtd > 0), consumidos, naoAtendido: restante };
}

/** Dados Iniciais (Exemplos) */
const PRODUTOS_INICIAIS = [
  {
    id: 1, name: "Lidocaína", brand: "Dentsply", dosage: "2%", unit: "Ampola",
    lotes: [
      { id: "b1", codigoLote: "LID-2024-A", qtd: 30, validade: "2025-08-10" },
      { id: "b2", codigoLote: "LID-2024-B", qtd: 18, validade: "2026-03-20" },
    ],
  },
  {
    id: 2, name: "Resina Composta", brand: "3M ESPE", dosage: "A2", unit: "Seringa",
    lotes: [
      { id: "b3", codigoLote: "RES-2024-A", qtd: 4, validade: "2025-04-15" },
    ],
  },
];

const USUARIOS = [
  { username: "ana",    password: "demo123", fullName: "Ana Silva",       role: "Dentista" },
  { username: "carlos", password: "demo123", fullName: "Carlos Mendes", role: "Técnico" },
  { username: "julia",  password: "demo123", fullName: "Julia Costa",   role: "Gerente" },
];

/** Componentes de Interface (Etiquetas e Alertas) */
function Etiqueta({ children, cor }) {
  const cores = {
    teal: "bg-teal-100 text-teal-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cores[cor] || cores.slate}`}>
      {children}
    </span>
  );
}

function AlertaValidade({ produto }) {
  const status = verificarStatusValidade(produto);
  if (!status || status === "ok") return null;
  if (status === "vencido") return <Etiqueta cor="red"><ShieldAlert className="w-3 h-3" />Vencido</Etiqueta>;
  return <Etiqueta cor="amber"><CalendarClock className="w-3 h-3" />Vence em breve</Etiqueta>;
}

/** COMPONENTE PRINCIPAL DO SISTEMA */
export default function App() {
  // Carregamento de dados do LocalStorage
  const [produtos, setProdutos] = useState(() => {
    try {
      const salvo = localStorage.getItem("estoque_ceo_v2");
      return salvo ? JSON.parse(salvo) : PRODUTOS_INICIAIS;
    } catch { return PRODUTOS_INICIAIS; }
  });

  const [movimentacoes, setMovimentacoes] = useState(() => {
    try {
      const salvo = localStorage.getItem("historico_ceo_v2");
      return salvo ? JSON.parse(salvo) : [];
    } catch { return []; }
  });

  // Persistência automática de dados
  useEffect(() => {
    localStorage.setItem("estoque_ceo_v2", JSON.stringify(produtos));
  }, [produtos]);

  useEffect(() => {
    localStorage.setItem("historico_ceo_v2", JSON.stringify(movimentacoes));
  }, [movimentacoes]);

  // Estados do Usuário e Navegação
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [formularioLogin, setFormularioLogin] = useState({ username: "", password: "" });
  const [erroLogin, setErroLogin] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("estoque");

  // Estados dos Formulários
  const [formProd, setFormProd] = useState({ nome: "", marca: "", especificacao: "", unidade: "" });
  const [erroProd, setErroProd] = useState("");
  const [formMov, setFormMov] = useState({ produtoId: "", tipo: "ENTRADA", qtd: "", codigoLote: "", validade: "" });
  const [erroMov, setErroMov] = useState("");
  const [sucessoMov, setSucessoMov] = useState("");
  const [expandido, setExpandido] = useState({});

  // Alertas de Dashboard
  const estoqueBaixo = useMemo(() => produtos.filter((p) => calcularSaldoTotal(p) <= 5), [produtos]);
  const alertasValidade = useMemo(() =>
    produtos.filter((p) => { const s = verificarStatusValidade(p); return s === "vencido" || s === "alerta"; }),
    [produtos]
  );

  /** Funções de Manipulação (Ações do Usuário) */
  const realizarLogin = (e) => {
    e.preventDefault();
    setErroLogin("");
    const user = USUARIOS.find((u) => u.username === formularioLogin.username && u.password === formularioLogin.password);
    if (!user) { setErroLogin("Usuário ou senha incorretos."); return; }
    setUsuarioAtual(user);
    setFormularioLogin({ username: "", password: "" });
  };

  const cadastrarProduto = (e) => {
    e.preventDefault();
    setErroProd("");
    if (!formProd.nome || !formProd.marca) { setErroProd("Preencha ao menos o nome e a marca."); return; }
    setProdutos((prev) => [
      ...prev,
      { id: Date.now(), name: formProd.nome, brand: formProd.marca, dosage: formProd.especificacao || "-", unit: formProd.unidade || "Unidade", lotes: [] },
    ]);
    setFormProd({ nome: "", marca: "", especificacao: "", unidade: "" });
    alert("Produto cadastrado no catálogo!");
  };

  const registrarMovimentacao = (e) => {
    e.preventDefault();
    setErroMov(""); setSucessoMov("");
    const pid = parseInt(formMov.produtoId);
    const qtd = parseInt(formMov.qtd);
    if (!pid || !qtd || qtd <= 0) { setErroMov("Selecione um produto e quantidade válida."); return; }

    const prod = produtos.find((p) => p.id === pid);

    if (formMov.tipo === "ENTRADA") {
      if (!formMov.codigoLote) { setErroMov("Informe o código do lote."); return; }
      if (!formMov.validade) { setErroMov("Informe a data de validade."); return; }

      const novoLote = {
        id: `l-${Date.now()}`,
        codigoLote: formMov.codigoLote.toUpperCase(),
        qtd,
        validade: formMov.validade,
      };

      setProdutos((prev) =>
        prev.map((p) => p.id === pid ? { ...p, lotes: [...(p.lotes || []), novoLote] } : p)
      );

      setMovimentacoes((prev) => [
        {
          id: gerarProximoId(prev), productId: pid, type: "ENTRADA", qty: qtd,
          ts: obterDataHora(), user: usuarioAtual.fullName, role: usuarioAtual.role,
          loteInfo: `Lote ${novoLote.codigoLote} · Val. ${formMov.validade}`,
        },
        ...prev,
      ]);
      setSucessoMov("Entrada registrada — lote criado!");
    } else {
      const total = calcularSaldoTotal(prod);
      if (qtd > total) { setErroMov(`Saldo insuficiente. Disponível: ${total} ${prod.unit}.`); return; }

      const { lotesAtualizados, consumidos } = aplicarFEFO(prod.lotes, qtd);
      setProdutos((prev) =>
        prev.map((p) => p.id === pid ? { ...p, lotes: lotesAtualizados } : p)
      );

      const infoLotes = consumidos.map((c) => `${c.qtd}x Lote ${c.codigoLote}`).join(" + ");
      setMovimentacoes((prev) => [
        {
          id: gerarProximoId(prev), productId: pid, type: "SAÍDA", qty: qtd,
          ts: obterDataHora(), user: usuarioAtual.fullName, role: usuarioAtual.role,
          loteInfo: infoLotes,
        },
        ...prev,
      ]);
      setSucessoMov(`Saída registrada (FEFO): ${infoLotes}`);
    }
    setFormMov({ produtoId: formMov.produtoId, tipo: formMov.tipo, qtd: "", codigoLote: "", validade: "" });
  };

  const alternarExpansao = (id) => setExpandido((prev) => ({ ...prev, [id]: !prev[id] }));

  /** TELA DE LOGIN */
  if (!usuarioAtual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm fade-in">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10 shadow-2xl">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/40">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white text-center mb-1">Estoque CEO UFPE</h1>
            <p className="text-teal-400 text-xs text-center mb-8 font-semibold uppercase tracking-widest">Controle de Lotes & Validade</p>

            <form onSubmit={realizarLogin} className="space-y-4">
              <input
                type="text" value={formularioLogin.username}
                onChange={(e) => setFormularioLogin({ ...formularioLogin, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none placeholder-slate-500 focus:border-teal-400 transition-all"
                placeholder="Usuário"
              />
              <input
                type="password" value={formularioLogin.password}
                onChange={(e) => setFormularioLogin({ ...formularioLogin, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none placeholder-slate-500 focus:border-teal-400 transition-all"
                placeholder="Senha"
              />
              {erroLogin && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{erroLogin}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-sm shadow-lg transition-all active:scale-95">
                Acessar Sistema
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /** DASHBOARD E NAVEGAÇÃO PRINCIPAL */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">Estoque CEO UFPE</h1>
              <p className="text-[9px] font-bold text-teal-500 uppercase tracking-widest">Hospital das Clínicas · v1.0</p>
            </div>
          </div>

          {/* Alertas Rápidos no Topo */}
          {(estoqueBaixo.length > 0 || alertasValidade.length > 0) && (
            <div className="hidden md:flex items-center gap-2">
              {alertasValidade.length > 0 && (
                <div className="pulse-warn flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {alertasValidade.length} alerta de validade
                </div>
              )}
              {estoqueBaixo.length > 0 && (
                <div className="pulse-warn flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {estoqueBaixo.length} estoque baixo
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-right border-r pr-3 border-slate-200">
              <p className="text-xs font-bold text-slate-700">{usuarioAtual.fullName}</p>
              <Etiqueta cor="teal">{usuarioAtual.role}</Etiqueta>
            </div>
            <button onClick={() => setUsuarioAtual(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {[
            { key: "estoque", label: "Inventário Geral", icon: ClipboardList },
            { key: "movimentacoes", label: "Histórico de Atividades", icon: Activity },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setAbaAtiva(key)}
              className={`flex items-center gap-2 px-1 py-3.5 text-xs font-bold border-b-2 transition-all ${
                abaAtiva === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-7">
        /** TELA DE INVENTÁRIO (PRODUTOS E MOVIMENTAÇÃO) */
        {abaAtiva === "estoque" && (
          <div className="flex flex-col gap-7 fade-in">

            {/* Formulário: Adicionar Novo Produto ao Catálogo */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" /> Cadastrar Novo Item no Catálogo
              </h2>
              <form onSubmit={cadastrarProduto} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { label: "Nome do Produto", key: "nome", placeholder: "Ex: Resina" },
                  { label: "Marca", key: "marca", placeholder: "Ex: 3M" },
                  { label: "Especificação", key: "especificacao", placeholder: "Ex: A2" },
                  { label: "Unidade de Medida", key: "unidade", placeholder: "Ex: Seringa" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                    <input
                      value={formProd[key]}
                      onChange={(e) => setFormProd({ ...formProd, [key]: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <button type="submit" className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 text-sm py-2">
                  Cadastrar Item
                </button>
              </form>
              {erroProd && <p className="text-rose-600 text-[11px] font-bold mt-2 ml-1">{erroProd}</p>}
            </div>

            <div className="grid lg:grid-cols-12 gap-7">
              {/* Formulário: Registrar Entrada/Saída de Estoque */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-20">
                  <h2 className="font-extrabold text-slate-800 mb-1 text-base">Movimentação</h2>
                  <p className="text-xs text-slate-400 mb-5">Entradas criam lotes · Saídas usam lógica FEFO.</p>

                  <form onSubmit={registrarMovimentacao} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Produto</label>
                      <select
                        value={formMov.produtoId}
                        onChange={(e) => { setFormMov({ ...formMov, produtoId: e.target.value }); setErroMov(""); setSucessoMov(""); }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none transition-all"
                      >
                        <option value="">Selecione um item...</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.brand}) · Saldo: {calcularSaldoTotal(p)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo de Operação</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["ENTRADA", "SAÍDA"].map((t) => (
                          <button
                            key={t} type="button"
                            onClick={() => setFormMov({ ...formMov, tipo: t, codigoLote: "", validade: "" })}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                              formMov.tipo === t
                                ? t === "ENTRADA" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-rose-50 border-rose-400 text-rose-700"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}
                          >
                            {t === "ENTRADA" ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                            {t === "ENTRADA" ? "Entrada" : "Saída"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campos extras apenas para ENTRADA */}
                    {formMov.tipo === "ENTRADA" && (
                      <div className="space-y-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1"><Layers className="w-3 h-3" /> Identificação do Lote</p>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cód. Lote</label>
                          <input
                            value={formMov.codigoLote}
                            onChange={(e) => setFormMov({ ...formMov, codigoLote: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none mono"
                            placeholder="Ex: ABC-123"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Validade</label>
                          <input
                            type="date"
                            value={formMov.validade}
                            onChange={(e) => setFormMov({ ...formMov, validade: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantidade</label>
                      <input
                        type="number" min="1" value={formMov.qtd}
                        onChange={(e) => setFormMov({ ...formMov, qtd: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mono"
                        placeholder="0"
                      />
                    </div>

                    {erroMov && <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold">{erroMov}</div>}
                    {sucessoMov && <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold">{sucessoMov}</div>}

                    <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 text-sm">
                      Confirmar Lançamento
                    </button>
                  </form>
                </div>
              </div>

              {/* Tabela Principal: Listagem de Produtos e Lotes Detalhados */}
              <div className="lg:col-span-8 space-y-5">
                {/* Banners de Alerta */}
                {(estoqueBaixo.length > 0 || alertasValidade.length > 0) && (
                  <div className="grid gap-2">
                    {alertasValidade.length > 0 && (
                      <div className="pulse-warn flex gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                        <CalendarClock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-bold">Atenção: Itens com validade crítica ou vencidos no estoque.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                    <h2 className="font-extrabold text-slate-800 text-sm">Controle de Inventário</h2>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{produtos.length} produtos cadastrados</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {produtos.map((p) => {
                      const saldo = calcularSaldoTotal(p);
                      const isExpandido = expandido[p.id];

                      return (
                        <div key={p.id}>
                          {/* Linha do Produto */}
                          <div
                            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                            onClick={() => alternarExpansao(p.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-800">{p.name}</span>
                                <AlertaValidade produto={p} />
                                {saldo <= 5 && <Etiqueta cor="red"><AlertTriangle className="w-3 h-3" />Estoque Baixo</Etiqueta>}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{p.brand} · <span className="italic">{p.dosage}</span> · {p.unit}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`mono text-sm font-bold px-3 py-1 rounded-full ${
                                saldo <= 5 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {saldo}
                              </span>
                              {isExpandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>

                          {/* Sub-tabela de Lotes (FEFO) */}
                          {isExpandido && p.lotes.length > 0 && (
                            <div className="bg-slate-50/80 border-t border-slate-100 px-6 pb-4 fade-in">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-3 pb-2">Lotes Ativos (Ordenados por Vencimento)</p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-200">
                                    <th className="text-left py-1">Cód. Lote</th>
                                    <th className="text-left py-1">Data Validade</th>
                                    <th className="text-right py-1">Qtd</th>
                                    <th className="text-right py-1">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/60">
                                  {[...p.lotes]
                                    .sort((a, b) => new Date(a.validade) - new Date(b.validade))
                                    .map((l) => {
                                      const dias = calcularDiasParaVencer(l.validade);
                                      return (
                                        <tr key={l.id}>
                                          <td className="py-1.5 mono font-medium text-slate-700">{l.codigoLote}</td>
                                          <td className="py-1.5 mono text-slate-500">{l.validade}</td>
                                          <td className="py-1.5 text-right font-bold text-slate-700 mono">{l.qtd}</td>
                                          <td className="py-1.5 text-right">
                                            {dias < 0 ? <Etiqueta cor="red">Vencido</Etiqueta> : dias <= 30 ? <Etiqueta cor="amber">Vence em {dias}d</Etiqueta> : <Etiqueta cor="green">OK</Etiqueta>}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        /** ABA DE HISTÓRICO: LOG COMPLETO DE OPERAÇÕES */
        {abaAtiva === "movimentacoes" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm fade-in">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h2 className="font-extrabold text-slate-800 text-sm">Histórico de Movimentações</h2>
              <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase">{movimentacoes.length} registros</span>
            </div>
            
            {movimentacoes.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">Nenhuma atividade registrada no sistema.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left">Data/Hora</th>
                      <th className="px-6 py-3 text-left">Produto</th>
                      <th className="px-6 py-3 text-left">Lote(s) Envolvido(s)</th>
                      <th className="px-6 py-3 text-center">Operação</th>
                      <th className="px-6 py-3 text-right">Quantidade</th>
                      <th className="px-6 py-3 text-right">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movimentacoes.map((m) => {
                      const p = produtos.find((x) => x.id === m.productId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3 mono text-xs text-slate-400">{m.ts}</td>
                          <td className="px-6 py-3 font-bold text-slate-700">{p?.name ?? "—"}</td>
                          <td className="px-6 py-3 mono text-[10px] text-slate-500 max-w-[200px] truncate">{m.loteInfo || "—"}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${
                              m.type === "ENTRADA" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}>
                              {m.type === "ENTRADA" ? "Entrada" : "Saída"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right mono font-bold text-slate-800">
                            {m.type === "ENTRADA" ? "+" : "−"}{m.qty}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="block text-xs font-bold text-slate-600">{m.user}</span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">{m.role}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}