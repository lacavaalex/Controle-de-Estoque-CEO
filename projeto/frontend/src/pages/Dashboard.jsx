import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Dashboard() {
  const navigate = useNavigate();
  // Recupera o usuário que salvamos no login
  const usuario = JSON.parse(localStorage.getItem('usuario_ceo'));

  const logout = () => {
    localStorage.removeItem('usuario_ceo');
    navigate('/');
  };

  return (
    <div className="container-principal">
      <div className="card-form" style={{ width: '600px' }}>
        <h1>Estoque CEO</h1>
        <p>Usuário: <strong>{usuario?.nome}</strong>!</p>
        <p>Cargo: <span className="tag-gestor" style={{color: '#990000', fontWeight: 'bold'}}>{usuario?.cargo}</span></p>

        <div style={{ marginTop: '30px', display: 'grid', gap: '10px' }}>
          {/* Botão visível para todos */}
          <button onClick={() => alert('Em breve: Lista de Materiais')}>Ver Estoque</button>

          {/* REGRA: Apenas Gestor vê este botão */}
          {usuario?.cargo === 'gestor' && (
            <button 
              onClick={() => navigate('/cadastro')}
              style={{ backgroundColor: '#28a745' }}
            >
              + Cadastrar Novo Usuário
            </button>
          )}

          <button onClick={logout} style={{ backgroundColor: '#444', marginTop: '20px' }}>Sair</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;