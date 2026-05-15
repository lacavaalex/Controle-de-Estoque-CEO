import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

// Função para criar a tela de cadastro de novos alunos/usuários
function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cargo, setCargo] = useState('almoxarife');

  const registrarUsuario = async (e) => {
    e.preventDefault();
    
    // Recupera o gestor logado do localStorage (você deve salvar isso no Login)
    const gestorLogado = JSON.parse(localStorage.getItem('usuario_ceo'));

    const dadosParaEnviar = { 
      nome, 
      email, 
      senha, 
      cargo, // Define o papel do novo usuário
      quemEstaCadastrando: gestorLogado?.email 
    };

    try {
      // Tentando fazer a conexão com o servidor na porta 3001
      const resposta = await fetch('http://localhost:3001/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Avisa que estamos enviando um JSON
        },
        body: JSON.stringify(dadosParaEnviar) // Transforma o objeto em texto
      });

      // Se o servidor responder que deu certo (status 201 ou 200)
      if (resposta.ok) {
        alert("Usuário cadastrado com sucesso no banco!");
        // Limpando os campos do formulário para o próximo cadastro
        setNome('');
        setEmail('');
        setSenha('');
        setConfirmarSenha('');
      } else {
        alert("O servidor recebeu, mas deu algum erro lá dentro.");
      }
    } catch (error) {
      // Se o servidor estiver desligado, ele cai aqui no catch
      console.error("Erro de conexão:", error);
      alert("Servidor desligado! Ligue o backend com 'node server.js'");
    }
  };

  return (
    <div className="container-principal">
      <div className="card-form">
        <h1>Novo Usuário</h1>
        {/* O formulário chama nossa função de registro ao clicar no botão */}
        <form onSubmit={registrarUsuario}>
          <input 
            type="text" 
            placeholder="Nome Completo" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required 
          />
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Sua Senha" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Confirme a Senha" 
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required 
          />
          <select 
            value={cargo} 
            onChange={(e) => setCargo(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}
          >
            <option value="almoxarife">Almoxarife</option>
            <option value="solicitante">Solicitante</option>
            <option value="gestor">Outro Gestor</option>
          </select>

          <button type="submit">Finalizar Cadastro</button>
        </form>
        <p style={{ marginTop: '15px' }}>
          Já tem conta? <Link to="/" style={{ color: '#646cff' }}>Fazer Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Cadastro;