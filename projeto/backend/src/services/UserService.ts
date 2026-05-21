import type { User } from "../entities/User.js";
import type { IUserService } from "../interfaces/service-interfaces/IUserService.js";
import type { IUserRepository } from "../interfaces/repository-interfaces/IUserRepo.js";

export interface RegisterDto {
    nome: string;
    email: string;
    senha: string;
    cargo: "gestor" | "almoxarife" | "solicitante";
}

export class UserService implements IUserService {
    constructor(private userRepository: IUserRepository) {}

    async login(email: string, senhaDigitada: string): Promise<User> {
        const resultado = await this.userRepository.buscarSenhaPorEmail(email);

        if (!resultado || resultado.senhaSalva !== senhaDigitada) {
            throw new Error("E-mail ou senha incorretos!");
        }

        return resultado.user;
    }

    async register(dados: RegisterDto, emailAutorizador?: string): Promise<User> {
        const users = await this.userRepository.getAllUsers();

        const userExists = users.find((u) => u.email === dados.email);
        if (userExists) throw new Error("Usuário já cadastrado com este e-mail");

        if (!emailAutorizador) throw new Error("Autorizador não identificado.");
        const autorizador = users.find((u) => u.email === emailAutorizador);
        if (!autorizador || autorizador.cargo !== "gestor") {
            throw new Error("Acesso Negado: Apenas Gestores do CEO podem cadastrar novos usuários.");
        }

        const newID = String(users.length).padStart(3, "0");

        const newUser: User = {
            id: newID,
            nome: dados.nome,
            email: dados.email,
            cargo: dados.cargo
        };

        await this.userRepository.createUser(newUser, dados.senha);

        return newUser;
    }
}