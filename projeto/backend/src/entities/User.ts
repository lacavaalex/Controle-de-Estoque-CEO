export interface User {
    id: string;
    nome: string;
    email: string;
    cargo: "gestor" | "almoxarife" | "solicitante";
}