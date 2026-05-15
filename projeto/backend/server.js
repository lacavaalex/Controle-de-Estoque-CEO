import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PATH_DB = path.join(__dirname, 'usuarios.json');

app.use(cors());
app.use(express.json());

// Rota de Login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  console.log(`Tentativa de login: ${email}`);

  try {
    const data = await fs.readFile(PATH_DB, 'utf-8');
    const json = JSON.parse(data);

    const usuario = json.usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
      console.log("Login bem-sucedido!");
      // Não enviamos a senha de volta por segurança
      const { senha: _, ...usuarioSemSenha } = usuario;
      res.json({ usuario: usuarioSemSenha });
    } else {
      console.log("Credenciais inválidas.");
      res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
    }
  } catch (error) {
    console.error("Erro ao ler o arquivo JSON:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor do CEO" });
  }
});

// Rota de Registro
app.post('/registrar', async (req, res) => {
  const { nome, email, senha, cargo, quemEstaCadastrando } = req.body;

  try {
    const data = await fs.readFile(PATH_DB, 'utf-8');
    const json = JSON.parse(data);

    const autorizador = json.usuarios.find(u => u.email === quemEstaCadastrando);

    if (!autorizador || autorizador.cargo !== 'gestor') {
      return res.status(403).json({ 
        mensagem: "Acesso Negado: Apenas Gestores do CEO podem cadastrar." 
      });
    }

    json.usuarios.push({ nome, email, senha, cargo });
    await fs.writeFile(PATH_DB, JSON.stringify(json, null, 4));
    res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro no servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor do CEO rodando em http://localhost:${PORT}`);
});