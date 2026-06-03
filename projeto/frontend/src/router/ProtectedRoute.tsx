// Guarda de rota: exige sessão. Sem identidade -> manda pro /login.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { identidade, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Carregando…
      </div>
    );
  }

  if (!identidade) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
