import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Função para verificar se a senha bate
export const verificarSenha = async (senhaDigitada, senhaCriptografada) => {
  return await bcrypt.compare(senhaDigitada, senhaCriptografada);
};

// Função para gerar o token de acesso
export const gerarToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, 'CHAVE_SECRETA_DO_SISTEMA', {
    expiresIn: '24h'
  });
};