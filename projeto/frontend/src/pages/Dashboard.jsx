import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

function Dashboard() {
  const [isRetracted, setIsRetracted] = useState(false);
  const navigate = useNavigate();
  
  const usuarioLogado = localStorage.getItem('usuario_ceo');
  const usuario = usuarioLogado ? JSON.parse(usuarioLogado) : { nome: 'Usuário', cargo: 'gestor' };

  const logout = () => {
    localStorage.removeItem('usuario_ceo');
    navigate('/');
  };

  return (
    <div className={`dashboard-layout ${isRetracted ? 'retracted' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          {!isRetracted && <span style={{ fontWeight: 'bold', color: '#990000', fontSize: '18px' }}>CEO UFPE</span>}
          <button 
            onClick={() => setIsRetracted(!isRetracted)} 
            style={{ width: 'auto', background: 'none', color: '#333', padding: '5px', border: 'none', cursor: 'pointer' }}
          >
            {isRetracted ? '→' : '←'}
          </button>
        </div>

        <nav className="menu">
          <div className="menu-item">
             <span style={{ marginRight: isRetracted ? '0' : '10px' }}>📦</span> 
             {!isRetracted && <span>Estoque</span>}
          </div>
          {usuario?.cargo === 'gestor' && (
            <div className="menu-item" onClick={() => navigate('/cadastro')}>
              <span style={{ marginRight: isRetracted ? '0' : '10px' }}>👤</span> 
              {!isRetracted && <span>Cadastrar Usuário</span>}
            </div>
          )}
        </nav>

        <div className="user-section" style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={logout} style={{ backgroundColor: '#444', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
            {isRetracted ? 'Sair' : 'Sair do Sistema'}
          </button>
        </div>
      </aside>

      <main className="content">
        <header>
          <h1>Painel de Controle</h1>
          <hr style={{ border: '0', borderTop: '1px solid #e0e0e0', margin: '20px 0' }} />
        </header>
        
        <div className="placeholder-real">
          <p>Welcome ao sistema de gestão do CEO. Selecione uma opção no menu lateral para começar a gerenciar o inventário.</p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;