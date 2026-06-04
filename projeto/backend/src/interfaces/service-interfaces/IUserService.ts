import type { User } from "../../entities/User.js";
// Importa o tipo direto do UserService:
import type { RegisterDto } from "../../services/UserService.js"; 

export interface IUserService {
    login(email: string, senhaDigitada: string): Promise<User>;
    register(dados: RegisterDto, emailAutorizador?: string): Promise<User>;
}