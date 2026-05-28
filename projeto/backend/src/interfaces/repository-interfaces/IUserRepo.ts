import type { User } from "../../entities/User.js";

export interface IUserRepository {
    createUser(user: User, senhaObscura: string): Promise<void>;
    getAllUsers(): Promise<User[]>;
    getUserById(id: string): Promise<User | null>;
    buscarSenhaPorEmail(email: string): Promise<{ user: User; senhaSalva: string } | null>;
    
    // adicionado o contrato de update para o service usar
    updateUser(id: string, dados: { email?: string; senha?: string }): Promise<User>;
}