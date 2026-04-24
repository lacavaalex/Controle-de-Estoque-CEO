import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { USUARIOS } from '@/data/data'

const CREDENCIAIS = {
  'gestao@ufpe.br':     { senha: 'gestao2026',   usuario: USUARIOS[0] },
  'almoxarife@ufpe.br': { senha: 'alm2026',      usuario: USUARIOS[1] },
  'dentista@ufpe.br':   { senha: 'dentista2026', usuario: USUARIOS[2] },
}

const DEMO_ACCOUNTS = [
  { label: 'Gestão',       email: 'gestao@ufpe.br',     senha: 'gestao2026',   tag: 'Coordenação' },
  { label: 'Almoxarife',   email: 'almoxarife@ufpe.br',  senha: 'alm2026',      tag: 'Dispensação' },
  { label: 'Dentista CEO', email: 'dentista@ufpe.br',    senha: 'dentista2026', tag: 'Clínica' },
]

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#111827',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  lineHeight: '1.5',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const [email,     setEmail]     = useState('')
  const [senha,     setSenha]     = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !senha) { setError('Preencha o e-mail e a senha.'); return }
    setLoading(true)
    setTimeout(() => {
      const cred = CREDENCIAIS[email.toLowerCase().trim()]
      if (!cred || cred.senha !== senha) {
        setError('E-mail ou senha incorretos.')
        setLoading(false)
        return
      }
      login(cred.usuario)
      navigate('/dashboard')
    }, 800)
  }

  function preencherDemo(acc) {
    setEmail(acc.email)
    setSenha(acc.senha)
    setError('')
  }

  const focusStyle = { borderColor: '#990000', boxShadow: '0 0 0 3px rgba(153,0,0,0.12)' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Painel esquerdo ── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden select-none"
        style={{ background: 'linear-gradient(135deg, #990000 0%, #6b0000 100%)' }}
      >
        {/* Brasão marca d'água */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/ufpe-brasao.png"
            alt=""
            style={{ width: '220px', opacity: 0.12 }}
            draggable={false}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* Topo */}
        <div className="relative z-10">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <img
                src="/ufpe-brasao.png"
                alt="UFPE"
                style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                onError={e => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { textContent: 'U', style: 'color:white;font-weight:900;font-size:18px' })) }}
              />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>UFPE</p>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: '14px' }}>Odontologia</p>
            </div>
          </div>

          <h1 style={{ fontSize: '52px', fontWeight: '900', color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>
            CEO<br />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>Estoque</span>
          </h1>
          <p style={{ marginTop: '20px', color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
            Sistema integrado de controle de estoque para o Centro de Especialidades Odontológicas da UFPE.
          </p>
        </div>

        {/* Rodapé */}
        <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: '📦', text: 'Dispensação e CEO em uma interface' },
            { icon: '⏰', text: 'Alertas de vencimento e estoque crítico' },
            { icon: '📋', text: 'Auditoria completa de movimentações' },
            { icon: '🔒', text: 'Controle de acesso por perfil' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{f.icon}</span>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{f.text}</p>
            </div>
          ))}
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            Protótipo de demonstração · UFPE 2026
          </p>
        </div>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f3f4f6', padding: '48px 24px'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile header */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#990000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>U</span>
            </div>
            <div>
              <p style={{ fontWeight: '900', color: '#111', fontSize: '18px', lineHeight: 1 }}>CEO Estoque</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>UFPE — Odontologia</p>
            </div>
          </div>

          {/* Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            padding: '32px',
          }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111827', marginBottom: '4px' }}>
                Bem-vindo de volta
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Acesse com suas credenciais institucionais
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* E-mail */}
              <Field label="E-mail institucional">
                <input
                  type="email"
                  placeholder="email@ufpe.br"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email"
                  style={{ ...inputStyle, ...(focusedField === 'email' ? focusStyle : {}) }}
                />
              </Field>

              {/* Senha */}
              <Field label="Senha">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => { setSenha(e.target.value); setError('') }}
                    onFocus={() => setFocusedField('senha')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="current-password"
                    style={{
                      ...inputStyle,
                      paddingRight: '40px',
                      ...(focusedField === 'senha' ? focusStyle : {})
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSenha(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9ca3af', padding: '0', display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showSenha ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </Field>

              {/* Erro */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', marginBottom: '16px',
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px'
                }}>
                  <svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ fontSize: '13px', color: '#b91c1c' }}>{error}</span>
                </div>
              )}

              {/* Botão entrar */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '11px 16px',
                  fontSize: '14px', fontWeight: '700', color: '#fff',
                  backgroundColor: loading ? '#cc6666' : '#990000',
                  border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s', fontFamily: 'inherit'
                }}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando…
                  </>
                ) : 'Entrar no Sistema'}
              </button>
            </form>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500', whiteSpace: 'nowrap' }}>
                acesso de demonstração
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Demo chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => preencherDemo(acc)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                    width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#990000'; e.currentTarget.style.backgroundColor = '#fff5f5' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      backgroundColor: '#990000', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700', flexShrink: 0
                    }}>
                      {acc.label[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>{acc.label}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{acc.tag}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9ca3af' }}>{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '20px' }}>
            Universidade Federal de Pernambuco · Departamento de Odontologia
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
