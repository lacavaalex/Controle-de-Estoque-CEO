import { useState, useEffect } from "react";
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  AlertTriangle, 
  ClipboardList, 
  Activity,
  LogOut,
  User as UserIcon
} from "lucide-react";

/** Injeção do Tailwind via CDN para garantir o visual moderno */
if (typeof document !== 'undefined') {
  const tailwindScript = document.createElement("script");
  tailwindScript.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(tailwindScript);
}

export default function App() {
  // ---- LÓGICA DE PERSISTÊNCIA (LOCALSTORAGE) ----
  const [products, setProducts] = useState(() => {
    const salvo = localStorage.getItem("dados_estoque");
    return salvo ? JSON.parse(salvo) : [
      { id: 1, name: "Lidocaína", brand: "Dentsply", dosage: "2%", unit: "Ampola", balance: 48 },
      { id: 2, name: "Resina Composta", brand: "3M ESPE", dosage: "A2", unit: "Seringa", balance: 12 },
      { id: 3, name: "Luvas Cirúrgicas", brand: "Medline", dosage: "Tam M", unit: "Caixa (100)", balance: 3 }
    ];
  });

  const [movements, setMovements] = useState(() => {
    const salvo = localStorage.getItem("historico_movimentacoes");
    return salvo ? JSON.parse(salvo) : [];
  });

  // Efeito para SALVAR automaticamente no navegador sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem("dados_estoque", JSON.stringify(products));
    localStorage.setItem("historico_movimentacoes", JSON.stringify(movements));
  }, [products, movements]);

  // ---- ESTADOS DO SISTEMA ----
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [tab, setTab] = useState("inventory");
  const [pForm, setPForm] = useState({ name: "", brand: "", dosage: "", unit: "" });
  const [pErr, setPErr] = useState("");
  const [mForm, setMForm] = useState({ productId: "", type: "ENTRADA", qty: "" });
  const [mErr, setMErr] = useState("");
  const [mOk, setMOk] = useState("");

  // Usuários do protótipo
  const users = [
    { username: "ana", password: "demo123", fullName: "Ana Silva", role: "Dentista" },
    { username: "carlos", password: "demo123", fullName: "Carlos Mendes", role: "Técnico" },
    { username: "julia", password: "demo123", fullName: "Julia Costa", role: "Gerente" },
  ];

  const perms = {
    "Dentista": { recordMovement: true, registerProduct: true, viewLog: true },
    "Técnico": { recordMovement: true, registerProduct: true, viewLog: true },
    "Gerente": { recordMovement: true, registerProduct: true, viewLog: true },
  };

  const can = (action) => currentUser && perms[currentUser.role][action];
  const nextId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1);
  const now = () => new Date().toLocaleString('pt-BR').slice(0, 16);

  // ---- HANDLERS (LÓGICA) ----
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginErr("");
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (!user) {
      setLoginErr("Usuário ou senha incorretos.");
      return;
    }
    setCurrentUser(user);
    setLoginForm({ username: "", password: "" });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    setPErr("");
    if (!pForm.name || !pForm.brand) {
      setPErr("Preencha ao menos o nome e a marca do produto.");
      return;
    }
    const newProduct = {
      id: Date.now(),
      name: pForm.name,
      brand: pForm.brand,
      dosage: pForm.dosage || "-",
      unit: pForm.unit || "Unidade",
      balance: 0
    };
    setProducts([...products, newProduct]);
    setPForm({ name: "", brand: "", dosage: "", unit: "" });
    alert("Produto cadastrado no catálogo!");
  };

  const handleMove = (e) => {
    e.preventDefault();
    setMErr("");
    setMOk("");
    const pid = parseInt(mForm.productId);
    const qty = parseInt(mForm.qty);
    if (!pid || !qty || qty <= 0) {
      setMErr("Selecione um produto e uma quantidade válida.");
      return;
    }
    const prod = products.find(p => p.id === pid);
    if (mForm.type === "SAÍDA" && qty > prod.balance) {
      setMErr(`Saldo insuficiente. Saldo atual: ${prod.balance} ${prod.unit}.`);
      return;
    }
    const delta = mForm.type === "ENTRADA" ? qty : -qty;
    setProducts(products.map(p => p.id === pid ? { ...p, balance: p.balance + delta } : p));
    setMovements([
      { id: nextId(movements), productId: pid, type: mForm.type, qty, ts: now(), user: currentUser.fullName, role: currentUser.role },
      ...movements,
    ]);
    setMOk("Movimentação registrada com sucesso!");
    setMForm({ ...mForm, qty: "" });
  };

  const lowStock = products.filter(p => p.balance <= 5);

  // ---- TELA DE LOGIN ----
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-200 via-teal-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md transition-all duration-500 hover:scale-[1.01]">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white p-10">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
                <Package className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 text-center mb-2 tracking-tight">Estoque Dental</h1>
            <p className="text-sm text-slate-500 text-center mb-10 font-medium">Gestão Odontológica Inteligente</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-teal-500/20 transition-all" placeholder="Usuário" />
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-teal-500/20 transition-all" placeholder="Senha" />
              {loginErr && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{loginErr}</div>}
              <button type="submit" className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-lg active:scale-95 transition-all">Acessar Sistema</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---- DASHBOARD ----
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Estoque Dental</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protótipo v0.2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right border-r pr-4 border-slate-200">
              <p className="text-sm font-bold text-slate-700">{currentUser.fullName}</p>
              <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-bold uppercase">{currentUser.role}</span>
            </div>
            <button onClick={() => setCurrentUser(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          <button onClick={() => setTab("inventory")} className={`flex items-center gap-2 px-2 py-4 text-sm font-bold transition-all border-b-2 ${ tab === "inventory" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-400 hover:text-slate-600" }`}>
            <ClipboardList className="w-4 h-4" /> Estoque
          </button>
          <button onClick={() => setTab("movements")} className={`flex items-center gap-2 px-2 py-4 text-sm font-bold transition-all border-b-2 ${ tab === "movements" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-400 hover:text-slate-600" }`}>
            <Activity className="w-4 h-4" /> Histórico
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === "inventory" && (
          <div className="flex flex-col gap-8">
            
            {/* FORMULÁRIO DE CADASTRO (CATÁLOGO) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-teal-50">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-teal-600" /> Adicionar Novo Produto ao Catálogo
              </h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome</label>
                  <input value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex: Resina" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Marca</label>
                  <input value={pForm.brand} onChange={e => setPForm({...pForm, brand: e.target.value})} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex: 3M" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Especificação</label>
                  <input value={pForm.dosage} onChange={e => setPForm({...pForm, dosage: e.target.value})} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex: A2" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Unidade</label>
                  <input value={pForm.unit} onChange={e => setPForm({...pForm, unit: e.target.value})} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex: Seringa" />
                </div>
                <button type="submit" className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm py-2">
                  Cadastrar Item
                </button>
              </form>
              {pErr && <p className="text-rose-600 text-[11px] font-bold mt-3 ml-1">{pErr}</p>}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* REGISTRAR MOVIMENTAÇÃO */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-8">
                  <h2 className="font-bold text-slate-800 mb-1">Entrada / Saída</h2>
                  <p className="text-xs text-slate-400 mb-6">Movimente o estoque existente.</p>
                  <form onSubmit={handleMove} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Produto</label>
                      <select value={mForm.productId} onChange={(e) => { setMForm({ ...mForm, productId: e.target.value }); setMErr(""); setMOk(""); }} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">Selecione...</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setMForm({ ...mForm, type: "ENTRADA" })} className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${ mForm.type === "ENTRADA" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-400" }`}><ArrowDownCircle className="w-4 h-4"/>Entrada</button>
                        <button type="button" onClick={() => setMForm({ ...mForm, type: "SAÍDA" })} className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${ mForm.type === "SAÍDA" ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-slate-200 text-slate-400" }`}><ArrowUpCircle className="w-4 h-4"/>Saída</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                      <input type="number" value={mForm.qty} onChange={(e) => setMForm({ ...mForm, qty: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="0" />
                    </div>
                    {mErr && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-bold">{mErr}</div>}
                    {mOk && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold">{mOk}</div>}
                    <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all">Confirmar Movimento</button>
                  </form>
                </div>
              </div>

              {/* INVENTÁRIO GERAL */}
              <div className="lg:col-span-8 space-y-6">
                {lowStock.length > 0 && (
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 font-bold">Atenção: {lowStock.length} itens com estoque baixo (5 ou menos).</p>
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 tracking-tight">Inventário Geral</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{products.length} Produtos Ativos</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left">Produto</th>
                        <th className="px-6 py-4 text-left">Marca</th>
                        <th className="px-6 py-4 text-left">Especificação</th>
                        <th className="px-6 py-4 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                          <td className="px-6 py-4 text-slate-500 italic">{p.brand}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{p.dosage} · {p.unit}</td>
                          <td className="px-6 py-4 text-right font-mono">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${ p.balance <= 5 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700" }`}> {p.balance} </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "movements" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Activity className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800">Histórico de Atividades</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Data/Hora</th>
                  <th className="px-6 py-4 text-left">Produto</th>
                  <th className="px-6 py-4 text-center">Operação</th>
                  <th className="px-6 py-4 text-right">Qtd</th>
                  <th className="px-6 py-4 text-right">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const p = products.find(x => x.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{m.ts}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{p?.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${m.type === "ENTRADA" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">{m.type === "ENTRADA" ? "+" : "-"}{m.qty}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-bold text-slate-600">{m.user}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold">{m.role}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}