// AppShell.jsx — casca da aplicação: sidebar (por perfil) + header + conteúdo.
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { navParaPerfil, ROTULO_PERFIL } from "./nav.js";
import "../styles/Shell.css";

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const itens = navParaPerfil(user?.perfil);

  async function sair() {
    await logout();
    navigate("/login", { replace: true });
  }

  const iniciais = (user?.nome || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="shell-sidebar">
        <div className="shell-brand">
          {!collapsed && (
            <span className="shell-brand-mark">
              HO<span>·UFPE</span>
            </span>
          )}
          <button
            className="shell-collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="shell-nav">
          {itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `shell-navitem ${isActive ? "is-active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="shell-navicon" aria-hidden>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="shell-user">
          <div className="shell-avatar" aria-hidden>{iniciais}</div>
          {!collapsed && (
            <div className="shell-user-info">
              <div className="shell-user-name" title={user?.nome}>{user?.nome}</div>
              <div className="shell-user-role">{ROTULO_PERFIL[user?.perfil] || user?.perfil}</div>
            </div>
          )}
        </div>
        <button className="btn btn-secondary btn-sm shell-logout" onClick={sair}>
          {collapsed ? "⎋" : "Sair"}
        </button>
      </aside>

      <main className="shell-content">
        <Outlet />
      </main>
    </div>
  );
}
