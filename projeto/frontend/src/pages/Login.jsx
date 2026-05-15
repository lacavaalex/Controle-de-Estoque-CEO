import React, { useState } from 'react';
import '../App.css'; // Usando o CSS global para estilizar a página
import { useNavigate, Link } from 'react-router-dom';

// Função principal que desenha a tela de Login
function Login() {
  // Criando estados para o React monitorar o que é digitado nos campos
  const navigate = useNavigate(); // Hook para navegar entre páginas
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Função que lida com o clique no botão de "Entrar"
  const entrarNoSistema = async (e) => {
    e.preventDefault();
    try {
      const resposta = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      // TESTE: Se o servidor deu log de sucesso, o status deve ser 200
      console.log("Status da resposta:", resposta.status);

      const dados = await resposta.json();
      console.log("Dados recebidos:", dados);

      if (resposta.ok) {
        localStorage.setItem('usuario_ceo', JSON.stringify(dados.usuario));
        console.log("Navegando para dashboard...");
        navigate('/dashboard'); 
      } else {
        alert(dados.mensagem);
      }
    } catch (error) {
      console.error("Erro detalhado:", error); // Isso vai te dizer se é JSON ou Rede
      alert("Erro de conexão! Olhe o console do navegador (F12).");
    }
  };

  return (
    <div className="container-principal">
      <div className="card-form">
        <h1>Login CEO</h1>
        
        <form onSubmit={entrarNoSistema}>
          {/* Campo para o e-mail */}
          <input 
            type="email" 
            placeholder="Digite seu e-mail"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} // Atualiza o estado a cada tecla
            required
          />

          {/* Campo para a senha */}
          <input 
            type="password" 
            placeholder="Digite sua senha"
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} // Atualiza o estado a cada tecla
            required
          />

          <button type="submit">Entrar no Sistema</button>
        </form>

      </div>
    </div>
  );
}

export default Login;