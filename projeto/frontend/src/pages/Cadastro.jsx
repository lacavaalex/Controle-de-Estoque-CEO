import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cargo, setCargo] = useState('almoxarife');

  const registrarUsuario = async (e) => {
    e.preventDefault();
    
    if (senha !== confirmarSenha) {
      alert("As senhas não conferem!");
      return;
    }

    const gestorLogado = JSON.parse(localStorage.getItem('usuario_ceo'));

    const dadosParaEnviar = { 
      nome, 
      email, 
      senha, 
      cargo, 
      quemEstaCadastrando: gestorLogado?.email 
    };

    try {
      const resposta = await fetch('http://localhost:3001/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnviar)
      });

      if (resposta.ok) {
        alert("Usuário cadastrado com sucesso!");
        navigate('/dashboard');
      } else {
        const erroDados = await resposta.json();
        alert(erroDados.mensagem);
      }
    } catch (error) {
      alert("Servidor desligado! Conecte o backend.");
    }
  };

  return (
    <div className="container-principal">
      <div className="card-form">
        <h1>Novo Usuário</h1>
        <form onSubmit={registrarUsuario}>
          <input type="text" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Sua Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          <input type="password" placeholder="Confirme a Senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
          <select 
            value={cargo} 
            onChange={(e) => setCargo(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', backgroundColor: '#333', color: 'white' }}
          >
            <option value="almoxarife">Almoxarife</option>
            <option value="dentista">Dentista</option>
            <option value="gestor">Gestor</option>
          </select>
          <button type="submit">Finalizar Cadastro</button>
        </form>
      </div>
    </div>
  );
}

export default Cadastro;