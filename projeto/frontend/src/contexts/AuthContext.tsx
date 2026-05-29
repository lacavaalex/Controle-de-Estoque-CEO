// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import type { User } from "../types/user";

interface AuthContextType {
    usuarioLogado: User | null;
    autenticar: (user: User, token: string) => void;
    logout: () => void;
    carregandoSessao: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LIMITE_INATIVIDADE = 8 * 60 * 60 * 1000; 

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);
    const [carregandoSessao, setCarregandoSessao] = useState(true);
    const timerRef = useRef<number | null>(null);

    // Carrega a sessão do sessionStorage ao iniciar o app
    useEffect(() => {
        const dadosSessao = sessionStorage.getItem("usuario_ceo");
        const token = sessionStorage.getItem("token_ceo");

        if (dadosSessao && token) {
            setUsuarioLogado(JSON.parse(dadosSessao));
        }
        setCarregandoSessao(false);
    }, []);

    // monitor de inatividade
    useEffect(() => {
        if (!usuarioLogado) return;

        const reiniciarTimerInatividade = () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            
            timerRef.current = window.setTimeout(() => {
                alert("Sua sessão expirou por inatividade. Faça login novamente.");
                logout();
            }, LIMITE_INATIVIDADE);
        };

        const eventos = ["mousemove", "keydown", "click", "scroll"];
        eventos.forEach(evento => window.addEventListener(evento, reiniciarTimerInatividade));

        reiniciarTimerInatividade();

        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            eventos.forEach(evento => window.removeEventListener(evento, reiniciarTimerInatividade));
        };
    }, [usuarioLogado]);

    function autenticar(user: User, token: string) {
        sessionStorage.setItem("usuario_ceo", JSON.stringify(user));
        sessionStorage.setItem("token_ceo", token);
        setUsuarioLogado(user);
    }

    function logout() {
        sessionStorage.removeItem("usuario_ceo");
        sessionStorage.removeItem("token_ceo");
        setUsuarioLogado(null);
    }

    return (
        <AuthContext.Provider value={{ usuarioLogado, autenticar, logout, carregandoSessao }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}