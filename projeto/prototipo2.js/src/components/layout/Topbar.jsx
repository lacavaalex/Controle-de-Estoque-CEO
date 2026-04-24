import { useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/estoque-dispensacao': 'Estoque — Dispensação',
  '/estoque-ceo': 'Estoque — CEO',
  '/solicitacoes': 'Solicitações',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const title = PAGE_TITLES[pathname] ?? 'CEO Estoque'

  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30"
      style={{ left: '240px', height: '56px' }}
    >
      <h2 className="text-base font-bold text-gray-800">{title}</h2>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:block">{usuario?.unidade}</span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ backgroundColor: '#990000' }}
        >
          {usuario?.avatar}
        </div>
      </div>
    </header>
  )
}
