import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Importando o Link para mudar de página sem dar refresh
import '../App.css'; // Usando o CSS global para estilizar a página

// Função principal que desenha a tela de Login
function Login() {
  // Criando estados para o React monitorar o que é digitado nos campos
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Função que lida com o clique no botão de "Entrar"
  const entrarNoSistema = (e) => {
    e.preventDefault(); // Comando essencial para o formulário não recarregar a página
    
    // Mostrando no console os dados capturados para testar se está funcionando
    console.log('--- Tentativa de Login ---');
    console.log('Email digitado:', email);
    console.log('Senha digitada:', senha);
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

        <p style={{marginTop: '15px', fontSize: '14px'}}>
          Ainda não tem conta? <Link to="/cadastro" style={{color: '#646cff'}}>Cadastre-se aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;