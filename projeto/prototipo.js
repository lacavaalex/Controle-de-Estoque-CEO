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

// ─── helpers ──────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleString("pt-BR").slice(0, 16);
const today = () => new Date().toISOString().split("T")[0];
const nextId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1);

function daysUntilExpiry(iso) {
  if (!iso) return Infinity;
  const diff = new Date(iso + "T00:00:00") - new Date(today() + "T00:00:00");
  return Math.ceil(diff / 86400000);
}

function batchBalance(product) {
  return (product.batches || []).reduce((s, b) => s + b.qty, 0);
}

function expiryStatus(product) {
  const batches = product.batches || [];
  if (!batches.length) return null;
  const minDays = Math.min(...batches.filter((b) => b.qty > 0).map((b) => daysUntilExpiry(b.expiryDate)));
  if (minDays < 0) return "expired";
  if (minDays <= 30) return "soon";
  return "ok";
}

// ─── FEFO: consume batches sorted by earliest expiry ──────────────────────────
function applyFEFO(batches, qty) {
  const sorted = [...batches].sort((a, b) =>
    new Date(a.expiryDate) - new Date(b.expiryDate)
  );
  let remaining = qty;
  const consumed = [];
  const updated = batches.map((b) => ({ ...b }));

  for (const ref of sorted) {
    if (remaining <= 0) break;
    const idx = updated.findIndex((b) => b.id === ref.id);
    const take = Math.min(updated[idx].qty, remaining);
    if (take > 0) {
      consumed.push({ batchCode: updated[idx].batchCode, batchId: updated[idx].id, qty: take });
      updated[idx] = { ...updated[idx], qty: updated[idx].qty - take };
      remaining -= take;
    }
  }
  return { updatedBatches: updated.filter((b) => b.qty > 0), consumed, notFulfilled: remaining };
}

// ─── seed data ────────────────────────────────────────────────────────────────
const SEED_PRODUCTS = [
  {
    id: 1, name: "Lidocaína", brand: "Dentsply", dosage: "2%", unit: "Ampola",
    batches: [
      { id: "b1", batchCode: "LID-2024-A", qty: 30, expiryDate: "2025-08-10" },
      { id: "b2", batchCode: "LID-2024-B", qty: 18, expiryDate: "2026-03-20" },
    ],
  },
  {
    id: 2, name: "Resina Composta", brand: "3M ESPE", dosage: "A2", unit: "Seringa",
    batches: [
      { id: "b3", batchCode: "RES-2024-A", qty: 4, expiryDate: "2025-04-15" },
    ],
  },
  {
    id: 3, name: "Luvas Cirúrgicas", brand: "Medline", dosage: "Tam M", unit: "Caixa (100)",
    batches: [
      { id: "b4", batchCode: "LUV-2024-A", qty: 3, expiryDate: "2027-01-01" },
    ],
  },
];

// ─── users / permissions ───────────────────────────────────────────────────────
const USERS = [
  { username: "ana",    password: "demo123", fullName: "Ana Silva",      role: "Dentista" },
  { username: "carlos", password: "demo123", fullName: "Carlos Mendes", role: "Técnico" },
  { username: "julia",  password: "demo123", fullName: "Julia Costa",   role: "Gerente" },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color }) {
  const map = {
    teal: "bg-teal-100 text-teal-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[color] || map.slate}`}>
      {children}
    </span>
  );
}

function ExpiryBadge({ product }) {
  const status = expiryStatus(product);
  if (!status || status === "ok") return null;
  if (status === "expired") return <Badge color="red"><ShieldAlert className="w-3 h-3" />Vencido</Badge>;
  return <Badge color="amber"><CalendarClock className="w-3 h-3" />Vence em breve</Badge>;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState(() => {
    try {
      const s = localStorage.getItem("dental_products_v2");
      return s ? JSON.parse(s) : SEED_PRODUCTS;
    } catch { return SEED_PRODUCTS; }
  });

  const [movements, setMovements] = useState(() => {
    try {
      const s = localStorage.getItem("dental_movements_v2");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("dental_products_v2", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("dental_movements_v2", JSON.stringify(movements));
  }, [movements]);

  // ── auth ──
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");

  // ── navigation ──
  const [tab, setTab] = useState("inventory");

  // ── product form ──
  const [pForm, setPForm] = useState({ name: "", brand: "", dosage: "", unit: "" });
  const [pErr, setPErr] = useState("");

  // ── movement form ──
  const [mForm, setMForm] = useState({ productId: "", type: "ENTRADA", qty: "", batchCode: "", expiryDate: "" });
  const [mErr, setMErr] = useState("");
  const [mOk, setMOk] = useState("");

  // ── expanded batch rows ──
  const [expanded, setExpanded] = useState({});

  // ── derived ──
  const lowStock = useMemo(() => products.filter((p) => batchBalance(p) <= 5), [products]);
  const expiryAlerts = useMemo(() =>
    products.filter((p) => { const s = expiryStatus(p); return s === "expired" || s === "soon"; }),
    [products]
  );

  // ── handlers ──
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginErr("");
    const user = USERS.find((u) => u.username === loginForm.username && u.password === loginForm.password);
    if (!user) { setLoginErr("Usuário ou senha incorretos."); return; }
    setCurrentUser(user);
    setLoginForm({ username: "", password: "" });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    setPErr("");
    if (!pForm.name || !pForm.brand) { setPErr("Preencha ao menos o nome e a marca."); return; }
    setProducts((prev) => [
      ...prev,
      { id: Date.now(), name: pForm.name, brand: pForm.brand, dosage: pForm.dosage || "-", unit: pForm.unit || "Unidade", batches: [] },
    ]);
    setPForm({ name: "", brand: "", dosage: "", unit: "" });
    alert("Produto cadastrado!");
  };

  const handleMove = (e) => {
    e.preventDefault();
    setMErr(""); setMOk("");
    const pid = parseInt(mForm.productId);
    const qty = parseInt(mForm.qty);
    if (!pid || !qty || qty <= 0) { setMErr("Selecione um produto e quantidade válida."); return; }

    const prod = products.find((p) => p.id === pid);

    if (mForm.type === "ENTRADA") {
      if (!mForm.batchCode) { setMErr("Informe o código do lote."); return; }
      if (!mForm.expiryDate) { setMErr("Informe a data de validade."); return; }

      const newBatch = {
        id: `b-${Date.now()}`,
        batchCode: mForm.batchCode.toUpperCase(),
        qty,
        expiryDate: mForm.expiryDate,
      };

      setProducts((prev) =>
        prev.map((p) =>
          p.id === pid ? { ...p, batches: [...(p.batches || []), newBatch] } : p
        )
      );

      setMovements((prev) => [
        {
          id: nextId(prev), productId: pid, type: "ENTRADA", qty,
          batchCode: newBatch.batchCode, expiryDate: mForm.expiryDate,
          ts: now(), user: currentUser.fullName, role: currentUser.role,
          loteInfo: `Lote ${newBatch.batchCode} · Val. ${mForm.expiryDate}`,
        },
        ...prev,
      ]);
      setMOk("Entrada registrada — lote criado!");
    } else {
      const total = batchBalance(prod);
      if (qty > total) { setMErr(`Saldo insuficiente. Disponível: ${total} ${prod.unit}.`); return; }

      const { updatedBatches, consumed } = applyFEFO(prod.batches, qty);
      setProducts((prev) =>
        prev.map((p) => p.id === pid ? { ...p, batches: updatedBatches } : p)
      );

      const loteInfo = consumed.map((c) => `${c.qty}x Lote ${c.batchCode}`).join(" + ");
      setMovements((prev) => [
        {
          id: nextId(prev), productId: pid, type: "SAÍDA", qty,
          ts: now(), user: currentUser.fullName, role: currentUser.role,
          loteInfo,
        },
        ...prev,
      ]);
      setMOk(`Saída FEFO: ${loteInfo}`);
    }
    setMForm({ productId: mForm.productId, type: mForm.type, qty: "", batchCode: "", expiryDate: "" });
  };

  const toggleExpanded = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── LOGIN SCREEN ──
  if (!currentUser) {
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

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text" value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                placeholder="Usuário (ana / carlos / julia)"
              />
              <input
                type="password" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                placeholder="Senha (demo123)"
              />
              {loginErr && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{loginErr}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-teal-900/30 transition-all active:scale-95">
                Acessar Sistema
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">Estoque CEO UFPE</h1>
              <p className="text-[9px] font-bold text-teal-500 uppercase tracking-widest">Lotes & Validade · v1.0</p>
            </div>
          </div>

          {/* alert pill */}
          {(lowStock.length > 0 || expiryAlerts.length > 0) && (
            <div className="hidden md:flex items-center gap-2">
              {expiryAlerts.length > 0 && (
                <div className="pulse-warn flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {expiryAlerts.length} alerta{expiryAlerts.length > 1 ? "s" : ""} de validade
                </div>
              )}
              {lowStock.length > 0 && (
                <div className="pulse-warn flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lowStock.length} estoque baixo
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-right border-r pr-3 border-slate-200">
              <p className="text-xs font-bold text-slate-700">{currentUser.fullName}</p>
              <Badge color="teal">{currentUser.role}</Badge>
            </div>
            <button onClick={() => setCurrentUser(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* nav */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {[
            { key: "inventory", label: "Estoque", icon: ClipboardList },
            { key: "movements", label: "Histórico", icon: Activity },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-1 py-3.5 text-xs font-bold border-b-2 transition-all ${
                tab === key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-7">
        {/* ── INVENTORY TAB ── */}
        {tab === "inventory" && (
          <div className="flex flex-col gap-7 fade-in">

            {/* add product */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" /> Adicionar Produto ao Catálogo
              </h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { label: "Nome", key: "name", placeholder: "Ex: Resina" },
                  { label: "Marca", key: "brand", placeholder: "Ex: 3M" },
                  { label: "Especificação", key: "dosage", placeholder: "Ex: A2" },
                  { label: "Unidade", key: "unit", placeholder: "Ex: Seringa" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                    <input
                      value={pForm[key]}
                      onChange={(e) => setPForm({ ...pForm, [key]: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <button type="submit" className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 text-sm py-2">
                  Cadastrar
                </button>
              </form>
              {pErr && <p className="text-rose-600 text-[11px] font-bold mt-2 ml-1">{pErr}</p>}
            </div>

            <div className="grid lg:grid-cols-12 gap-7">
              {/* movement form */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-20">
                  <h2 className="font-extrabold text-slate-800 mb-1 text-base">Entrada / Saída</h2>
                  <p className="text-xs text-slate-400 mb-5">Entradas criam lotes · Saídas usam FEFO.</p>

                  <form onSubmit={handleMove} className="space-y-4">
                    {/* product select */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Produto</label>
                      <select
                        value={mForm.productId}
                        onChange={(e) => { setMForm({ ...mForm, productId: e.target.value }); setMErr(""); setMOk(""); }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 outline-none transition-all"
                      >
                        <option value="">Selecione...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.brand}) · {batchBalance(p)} {p.unit}</option>
                        ))}
                      </select>
                    </div>

                    {/* type toggle */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["ENTRADA", "SAÍDA"].map((t) => (
                          <button
                            key={t} type="button"
                            onClick={() => setMForm({ ...mForm, type: t, batchCode: "", expiryDate: "" })}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                              mForm.type === t
                                ? t === "ENTRADA" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-rose-50 border-rose-400 text-rose-700"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {t === "ENTRADA" ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                            {t === "ENTRADA" ? "Entrada" : "Saída"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* batch fields – only on ENTRADA */}
                    {mForm.type === "ENTRADA" && (
                      <div className="space-y-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1"><Layers className="w-3 h-3" /> Dados do Lote</p>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Código do Lote</label>
                          <input
                            value={mForm.batchCode}
                            onChange={(e) => setMForm({ ...mForm, batchCode: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/40 mono"
                            placeholder="Ex: LID-2025-C"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Validade</label>
                          <input
                            type="date"
                            value={mForm.expiryDate}
                            onChange={(e) => setMForm({ ...mForm, expiryDate: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
                          />
                        </div>
                      </div>
                    )}

                    {mForm.type === "SAÍDA" && (
                      <div className="flex items-center gap-2 p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] text-teal-700 font-semibold">
                        <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
                        FEFO ativo: saída pelo lote mais próximo do vencimento.
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantidade</label>
                      <input
                        type="number" min="1" value={mForm.qty}
                        onChange={(e) => setMForm({ ...mForm, qty: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 mono"
                        placeholder="0"
                      />
                    </div>

                    {mErr && <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/>{mErr}</div>}
                    {mOk && <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold">{mOk}</div>}

                    <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 text-sm">
                      Confirmar Movimentação
                    </button>
                  </form>
                </div>
              </div>

              {/* inventory table */}
              <div className="lg:col-span-8 space-y-5">
                {/* alert banner */}
                {(lowStock.length > 0 || expiryAlerts.length > 0) && (
                  <div className="grid gap-2">
                    {expiryAlerts.length > 0 && (
                      <div className="pulse-warn flex gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                        <CalendarClock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-bold">
                          {expiryAlerts.length} produto(s) com lote vencido ou próximo ao vencimento: {expiryAlerts.map((p) => p.name).join(", ")}.
                        </p>
                      </div>
                    )}
                    {lowStock.length > 0 && (
                      <div className="flex gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-800 font-bold">
                          {lowStock.length} produto(s) com estoque baixo (≤ 5): {lowStock.map((p) => p.name).join(", ")}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                    <h2 className="font-extrabold text-slate-800 text-sm">Inventário Geral</h2>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{products.length} produtos</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const bal = batchBalance(p);
                      const isExpanded = expanded[p.id];
                      const status = expiryStatus(p);

                      return (
                        <div key={p.id}>
                          {/* product row */}
                          <div
                            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                            onClick={() => toggleExpanded(p.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-800">{p.name}</span>
                                <ExpiryBadge product={p} />
                                {bal <= 5 && <Badge color="red"><AlertTriangle className="w-3 h-3" />Baixo</Badge>}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{p.brand} · <span className="italic">{p.dosage}</span> · {p.unit}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`mono text-sm font-bold px-3 py-1 rounded-full ${
                                bal <= 5 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {bal}
                              </span>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                                <Layers className="w-3 h-3" />
                                {p.batches.length} lote{p.batches.length !== 1 ? "s" : ""}
                              </div>
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                : <ChevronDown className="w-4 h-4 text-slate-400" />
                              }
                            </div>
                          </div>

                          {/* batches sub-table */}
                          {isExpanded && p.batches.length > 0 && (
                            <div className="bg-slate-50/80 border-t border-slate-100 px-6 pb-4 fade-in">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-3 pb-2 flex items-center gap-1">
                                <Layers className="w-3 h-3" /> Lotes ativos
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[9px] font-bold text-slate-400 uppercase">
                                      <th className="text-left py-1 pr-4">Código</th>
                                      <th className="text-left py-1 pr-4">Validade</th>
                                      <th className="text-right py-1">Qtd</th>
                                      <th className="text-right py-1 pl-3">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200/60">
                                    {[...p.batches]
                                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                                      .map((b) => {
                                        const d = daysUntilExpiry(b.expiryDate);
                                        return (
                                          <tr key={b.id}>
                                            <td className="py-1.5 pr-4 mono font-medium text-slate-700">{b.batchCode}</td>
                                            <td className="py-1.5 pr-4 mono text-slate-500">{b.expiryDate}</td>
                                            <td className="py-1.5 text-right font-bold text-slate-700 mono">{b.qty}</td>
                                            <td className="py-1.5 pl-3 text-right">
                                              {d < 0
                                                ? <Badge color="red"><ShieldAlert className="w-3 h-3" />Vencido</Badge>
                                                : d <= 30
                                                  ? <Badge color="amber"><CalendarClock className="w-3 h-3" />{d}d</Badge>
                                                  : <Badge color="green">OK</Badge>
                                              }
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {isExpanded && p.batches.length === 0 && (
                            <div className="px-6 pb-4 pt-2 text-xs text-slate-400 italic fade-in">Nenhum lote registrado para este produto.</div>
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

        {/* ── HISTORY TAB ── */}
        {tab === "movements" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm fade-in">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h2 className="font-extrabold text-slate-800 text-sm">Histórico de Movimentações</h2>
              <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase">{movements.length} registros</span>
            </div>
            
            {movements.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">Nenhuma movimentação registrada ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left">Data/Hora</th>
                      <th className="px-6 py-3 text-left">Produto</th>
                      <th className="px-6 py-3 text-left">Lote(s)</th>
                      <th className="px-6 py-3 text-center">Operação</th>
                      <th className="px-6 py-3 text-right">Qtd</th>
                      <th className="px-6 py-3 text-right">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((m) => {
                      const p = products.find((x) => x.id === m.productId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3 mono text-xs text-slate-400">{m.ts}</td>
                          <td className="px-6 py-3 font-bold text-slate-700">{p?.name ?? "—"}</td>
                          <td className="px-6 py-3 mono text-[10px] text-slate-500 max-w-[180px] truncate" title={m.loteInfo}>{m.loteInfo || "—"}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${
                              m.type === "ENTRADA" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}>
                              {m.type}
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