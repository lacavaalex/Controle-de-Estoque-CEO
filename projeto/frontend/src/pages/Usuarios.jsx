import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { provisionarUsuario } from '../api/auth.js';
import { listarSetores } from '../api/setores.js';
import { PageHead } from "../app/ui.jsx"; 
import '../styles/App.css';

export default function Usuarios() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [perfil, setPerfil] = useState('almoxarife');
  const [setorId, setSetorId] = useState('');
  const [setores, setSetores] = useState([]);
  
  const [carregando, setCarregando] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState(null);
  const [erro, setErro] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Proteção RBAC: Se não for gestor, volta pro dashboard
    if (user?.perfil !== 'gestor') {
        navigate('/dashboard', { replace: true });
        return;
    }
    // Carrega os setores para o select
    listarSetores().then(setSetores).catch(console.error);
  }, [user, navigate]);

  const registrar = async (e) => {
    e.preventDefault();
    setErro(null);
    setSenhaGerada(null);
    setCarregando(true);

    try {
      // Gera a senha provisória aqui no frontend para enviar ao backend
      const senhaAleatoria = "CEO-" + Math.floor(100000 + Math.random() * 900000);

      // A função conectada ao backend via api.post('/usuarios')
      await provisionarUsuario({ 
        nome, 
        email, 
        cargo,
        perfil, 
        setorId: Number(setorId),
        senhaProvisoria: senhaAleatoria 
      });
      
      // Captura a senha gerada e exibe em destaque [CEO-227]
      setSenhaGerada(senhaAleatoria);
      
      // Limpa o formulário
      setNome(''); setEmail(''); setCargo('');
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Erro ao provisionar usuário");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <PageHead title="Gestão de Usuários" sub="Provisionamento de novos acessos ao sistema." />
      
      <div className="panel" style={{ padding: 'var(--sp-4)', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--sp-4)' }}>Novo Usuário</h3>
        
        {erro && <div className="alert alert-danger" style={{ marginBottom: '15px' }}>{erro}</div>}
        
        {senhaGerada ? (
          <div className="alert alert-info" style={{ textAlign: 'center', padding: '30px' }}>
            <h4 style={{ color: '#0c5460' }}>✅ Conta criada com sucesso!</h4>
            <p>A senha provisória do usuário é:</p>
            <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '15px 0', letterSpacing: '2px' }}>
              <code>{senhaGerada}</code>
            </div>
            <p style={{ fontSize: '13px', color: '#666' }}>
              O usuário será obrigado a trocar esta senha no primeiro login.
            </p>
            <button className="btn btn-secondary" onClick={() => setSenhaGerada(null)}>
              Cadastrar outro usuário
            </button>
          </div>
        ) : (
          <form onSubmit={registrar} className="field-row" style={{ flexDirection: 'column' }}>
            <div className="field" style={{ width: '100%' }}>
              <label>Nome Completo</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="field" style={{ width: '100%' }}>
              <label>E-mail Institucional (@ufpe.br)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field" style={{ width: '100%' }}>
              <label>Cargo / Função</label>
              <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} required />
            </div>
            
            <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Perfil de Acesso</label>
                <select value={perfil} onChange={(e) => setPerfil(e.target.value)} required>
                  <option value="solicitante">Solicitante</option>
                  <option value="almoxarife">Almoxarife</option>
                  <option value="gestor">Gestor</option>
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Setor Vinculado</label>
                <select value={setorId} onChange={(e) => setSetorId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={carregando} style={{ marginTop: '15px' }}>
              {carregando ? "Criando..." : "Criar Usuário"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}