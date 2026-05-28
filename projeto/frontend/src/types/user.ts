export interface User {
    id: string;
    nome: string;
    email: string;
    cargo: "gestor" | "almoxarife" | "solicitante";
}

export interface RegisterDto {
    nome: string;
    email: string;
    senha: string;
    cargo: "gestor" | "almoxarife" | "solicitante";
}