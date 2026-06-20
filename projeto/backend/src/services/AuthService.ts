// =============================================================================
// AuthService — login (bcrypt + JWT) e provisionamento de usuário por gestor.
// Núcleo do EP01. Usa o modelo v2 (usuario com senha_hash).
//
// Decisões refletidas:
//  - Senha sempre em hash bcrypt (RNF03.3); nunca texto puro.
//  - Login institucional @ufpe.br (RN01) — também garantido por CHECK no banco.
//  - register = criação por gestor (US-EP01-06), sem cadastro público; RBAC de
//    provisionamento em auth/rbac.ts. Senha provisória + flag trocar_senha.
//  - Logout: JWT stateless — invalidação real fica como TODO (denylist), ver
//    ADR-0005.
// =============================================================================
import type { IUsuarioRepository } from "../interfaces/repository-interfaces/IUsuarioRepo.js";
import type { ISetorRepository } from "../interfaces/repository-interfaces/ISetorRepo.js";
import type { Usuario, Perfil } from "../entities/index.js";
import { gerarHashSenha, verificarSenha } from "../auth/senha.js";
import { assinarToken } from "../auth/jwt.js";
import { podeProvisionarUsuario, type Identidade } from "../auth/rbac.js";

export interface DadosLogin {
  email: string;
  senha: string;
}

export interface DadosProvisionamento {
  nome: string;
  email: string;
  cargo: string;
  perfil: Perfil;
  setorId: number;
  senhaProvisoria: string;
}

export interface ResultadoLogin {
  token: string;
  usuario: Omit<Usuario, "senhaHash">;
}

function semHash(u: Usuario): Omit<Usuario, "senhaHash"> {
  const { senhaHash, ...resto } = u;
  return resto;
}

export class AuthService {
  constructor(
    private usuarioRepo: IUsuarioRepository,
    private setorRepo: ISetorRepository,
  ) {}

  async login({ email, senha }: DadosLogin): Promise<ResultadoLogin> {
    const usuario = await this.usuarioRepo.buscarPorEmail(email);
    // Mensagem genérica para não revelar se o e-mail existe.
    const erroGenerico = new Error("E-mail ou senha incorretos");

    if (usuario === null || usuario.senhaHash === null) throw erroGenerico;
    const ok = await verificarSenha(senha, usuario.senhaHash);
    if (!ok) throw erroGenerico;

    const token = assinarToken({
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      setorId: usuario.setorId,
    });

    return { token, usuario: semHash(usuario) };
  }

  /**
   * Provisiona um usuário (criação por gestor). `autor` é a Identidade do gestor
   * autenticado. Aplica o RBAC de provisionamento (RN01 / US-EP01-06).
   */
  async provisionarUsuario(
    autor: Identidade,
    dados: DadosProvisionamento,
  ): Promise<Omit<Usuario, "senhaHash">> {
    if (!podeProvisionarUsuario(autor, dados.perfil, dados.setorId)) {
      throw new Error("Acesso negado: seu perfil/setor não pode provisionar este usuário");
    }

    if (!dados.email.endsWith("@ufpe.br")) {
      throw new Error("E-mail deve ser institucional (@ufpe.br)");
    }

    const jaExiste = await this.usuarioRepo.buscarPorEmail(dados.email);
    if (jaExiste !== null) throw new Error("Já existe um usuário com este e-mail");

    const setor = await this.setorRepo.buscarPorId(dados.setorId);
    if (setor === null) throw new Error("Setor informado não existe");

    const senhaHash = await gerarHashSenha(dados.senhaProvisoria);

    const criado = await this.usuarioRepo.criar({
      nome: dados.nome,
      email: dados.email,
      cargo: dados.cargo,
      perfil: dados.perfil,
      setorId: dados.setorId,
      senhaHash,
      // Força troca no primeiro login (RNF03 — senha provisória).
      trocarSenha: true,
    });

    return semHash(criado);
  }

  /**
   * Atualiza a senha do usuário autenticado e remove a flag de primeiro acesso.
   */
  async atualizarSenha(autor: Identidade, novaSenha: string): Promise<void> {
    if (!novaSenha || novaSenha.length < 8) {
      throw new Error("A nova senha deve ter no mínimo 8 caracteres");
    }

    const idUsuario = autor.usuarioId;

    const usuario = await this.usuarioRepo.buscarPorId(Number(idUsuario));
    if (!usuario) throw new Error("Usuário não encontrado");

    const senhaHash = await gerarHashSenha(novaSenha);

    // Atualiza a senha e libera o acesso ao sistema
    await this.usuarioRepo.atualizar(usuario.id, {
      senhaHash,
      trocarSenha: false,
    });
  }
}
