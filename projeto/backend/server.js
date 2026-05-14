// No padrão "module", usamos import no lugar do require
import express from 'express'; // Importando o framework para criar o servidor
import cors from 'cors'; // Importando o liberador de acessos (CORS)

const app = express();

// Configurações para o servidor entender os dados do formulário
app.use(cors()); // Libera o acesso para o nosso frontend (React)
app.use(express.json()); // Serve para o servidor conseguir ler o formato JSON

// Criando uma lista vazia para salvar os usuários (nosso banco de dados fake)
let bancoDeDadosFake = [];

// Rota que recebe os dados do formulário de cadastro do React
app.post('/registrar', (req, res) => {
  const dadosRecebidos = req.body; // Pega o nome, email e senha enviados
  
  // Guardando o novo usuário na nossa lista
  bancoDeDadosFake.push(dadosRecebidos);
  
  // Mostra no terminal do VS Code quem se cadastrou
  console.log('--- Usuário Cadastrado com Sucesso ---');
  console.log('Nome:', dadosRecebidos.nome);
  console.log('Email:', dadosRecebidos.email);
  console.log('Total no banco:', bancoDeDadosFake.length);

  // Manda a resposta de volta para o frontend
  res.status(201).json({ mensagem: "Usuário salvo com sucesso no servidor!" });
});

// Fazendo o servidor rodar na porta 3001
app.listen(3001, () => {
  console.log('Servidor do CEO rodando liso na porta 3001!');
});