import React, { useState } from 'react';
import '../styles/App.css'; 
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const entrarNoSistema = async (e) => {
    e.preventDefault();
    try {
      const resposta = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        localStorage.setItem('usuario_ceo', JSON.stringify(dados.usuario));
        navigate('/dashboard'); 
      } else {
        alert(dados.mensagem);
      }
    } catch (error) {
      alert("Erro de conexão! Verifique se o backend está rodando.");
    }
  };

  return (
    <div className="container-principal">
      <div className="card-form">
        <h1>Login CEO</h1>
        <form onSubmit={entrarNoSistema}>
          <input 
            type="email" 
            placeholder="Digite seu e-mail"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <input 
            type="password" 
            placeholder="Digite sua senha"
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            required
          />
          <button type="submit">Entrar no Sistema</button>
        </form>
      </div>
    </div>
  );
}

export default Login;