// Casca da aplicação: navegação lateral + área de conteúdo (Outlet).
// Visual ainda enxuto/neutro — a identidade UFPE entra via tokens de theme.css.
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/estoque-ceo", label: "Estoque CEO", end: false },
  { to: "/estoque-dispensacao", label: "Estoque Dispensação", end: false },
  { to: "/solicitacoes", label: "Solicitações", end: false },
];

export function AppLayout() {
  const { usuario, identidade, logout } = useAuth();

  return (
    <div className="flex h-full">
      <aside className="flex w-60 flex-col bg-brand-strong text-white">
        <div className="px-5 py-5 text-lg font-bold">
          Estoque CEO
          <span className="block text-xs font-normal text-white/70">UFPE · Odontologia</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/15 px-5 py-4 text-xs text-white/70">
          <div className="font-medium text-white">{usuario?.nome ?? "Usuário"}</div>
          <div className="capitalize">{identidade?.perfil}</div>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-white/80 underline-offset-2 hover:underline"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
