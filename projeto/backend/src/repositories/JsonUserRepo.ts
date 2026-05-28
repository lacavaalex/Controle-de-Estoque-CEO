import type { IUserRepository } from "../interfaces/repository-interfaces/IUserRepo.js";
import type { User } from "../entities/User.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "path";

interface UserRow extends User {
    senha: string;
}

const filePath = path.resolve(process.cwd(), "data", "UsersDB.json");

async function readUsersRaw(): Promise<UserRow[]> {
    try {
        const data = await readFile(filePath, "utf-8");
        const json = JSON.parse(data);
        return json.usuarios || json;
    } catch {
        return [];
    }
}

async function writeUsersRaw(users: UserRow[]): Promise<void> {
    await writeFile(filePath, JSON.stringify({ usuarios: users }, null, 2), "utf-8");
}

export class JsonUserRepo implements IUserRepository {
    
    async createUser(user: User, senhaObscura: string): Promise<void> {
        const users = await readUsersRaw();
        const newUserRow: UserRow = { ...user, senha: senhaObscura };
        users.push(newUserRow);
        await writeUsersRaw(users);
    }

    async getAllUsers(): Promise<User[]> {
        const rows = await readUsersRaw();
        return rows.map(({ senha, ...user }) => user);
    }

    async getUserById(id: string): Promise<User | null> {
        const rows = await readUsersRaw();
        const found = rows.find((u) => u.id === id);
        if (!found) return null;
        
        const { senha, ...user } = found;
        return user;
    }

    async buscarSenhaPorEmail(email: string): Promise<{ user: User; senhaSalva: string } | null> {
        const rows = await readUsersRaw();
        const found = rows.find((u) => u.email === email);
        if (!found) return null;

        const { senha, ...user } = found;
        return { user, senhaSalva: senha };
    }

    async updateUser(id: string, dados: { email?: string; senha?: string }): Promise<User> {
        const rows = await readUsersRaw();
        const index = rows.findIndex((u) => u.id === id);

        if (index === -1) {
            throw new Error("usuario nao encontrado no banco de dados.");
        }

        // Armazena numa constante e garante a sua existencia para acalmar o compilador
        const userRow = rows[index];
        if (!userRow) {
            throw new Error("usuario nao encontrado no banco de dados.");
        }

        // Atualiza apenas os campos fornecidos
        if (dados.email) userRow.email = dados.email;
        if (dados.senha) userRow.senha = dados.senha;

        // Salva as alterações de volta no ficheiro JSON
        await writeUsersRaw(rows);

        // Separa a senha do objeto para não retornar dados sensíveis
        const { senha, ...userAtualizado } = userRow;
        return userAtualizado;
    }
}