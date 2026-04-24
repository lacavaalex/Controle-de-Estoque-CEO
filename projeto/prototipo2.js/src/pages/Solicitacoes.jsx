import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSolicitacoes } from '@/context/SolicitacoesContext'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import NovaSolicitacaoModal from '@/components/solicitacoes/NovaSolicitacaoModal'
import NegarModal from '@/components/solicitacoes/NegarModal'

const STATUS_LABELS = { pendente: 'Pendente', aprovada: 'Aprovada', negada: 'Negada' }
const TABS = ['pendente', 'aprovada', 'negada', 'todas']
const TAB_LABELS = { pendente: 'Pendentes', aprovada: 'Aprovadas', negada: 'Negadas', todas: 'Todas' }

// ─── Row shared component ─────────────────────────────────────
function SolRow({ s, showActions = false, onAprovar, onNegar }) {
  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="text-xs font-mono text-gray-400">{s.id}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{s.solicitante}</p>
        <p className="text-xs text-gray-400">{s.cargo}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{s.itemNome}</p>
        <p className="text-xs text-gray-500">{s.quantidadeSolicitada} {s.unidade}</p>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
        <p className="text-xs text-gray-500 line-clamp-2">{s.justificativa}</p>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {new Date(s.dataSolicitacao).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-4 py-3">
        <Badge variant={s.status}>{STATUS_LABELS[s.status]}</Badge>
        {s.status === 'negada' && s.observacao && (
          <p className="text-xs text-gray-400 mt-1 max-w-xs line-clamp-1" title={s.observacao}>
            "{s.observacao}"
          </p>
        )}
      </td>
      {showActions && (
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <Button variant="success" size="sm" onClick={() => onAprovar(s.id)}>Aprovar</Button>
            <Button variant="danger" size="sm" onClick={() => onNegar(s)}>Negar</Button>
          </div>
        </td>
      )}
      <td className="px-4 py-3 hidden xl:table-cell">
        <p className="text-xs text-gray-400">{s.responsavel ?? '—'}</p>
        {s.dataConclusao && (
          <p className="text-xs text-gray-300">{new Date(s.dataConclusao).toLocaleDateString('pt-BR')}</p>
        )}
      </td>
    </tr>
  )
}

function TableHeader({ showActions }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-gray-50">
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitante</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Justificativa</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
        {showActions && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>}
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Responsável</th>
      </tr>
    </thead>
  )
}

// ─── Almoxarife view ──────────────────────────────────────────
function ViewAlmoxarife() {
  const { solicitacoes, aprovar, negar } = useSolicitacoes()
  const { usuario } = useAuth()
  const [tab, setTab] = useState('pendente')
  const [negarTarget, setNegarTarget] = useState(null)

  const displayed = tab === 'todas'
    ? solicitacoes
    : solicitacoes.filter(s => s.status === tab)

  const counts = {
    pendente: solicitacoes.filter(s => s.status === 'pendente').length,
    aprovada: solicitacoes.filter(s => s.status === 'aprovada').length,
    negada:   solicitacoes.filter(s => s.status === 'negada').length,
    todas:    solicitacoes.length,
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Gerenciar Solicitações</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t
                ? 'border-[#990000] text-[#990000]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {TAB_LABELS[t]}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold
              ${tab === t ? 'bg-red-100 text-[#990000]' : 'bg-gray-100 text-gray-500'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader showActions={tab === 'pendente' || tab === 'todas'} />
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    Nenhuma solicitação nesta categoria.
                  </td>
                </tr>
              ) : (
                displayed.map(s => (
                  <SolRow
                    key={s.id}
                    s={s}
                    showActions={s.status === 'pendente' && (tab === 'pendente' || tab === 'todas')}
                    onAprovar={(id) => aprovar(id, usuario.nome)}
                    onNegar={(sol) => setNegarTarget(sol)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NegarModal
        isOpen={!!negarTarget}
        onClose={() => setNegarTarget(null)}
        solicitacao={negarTarget}
        onConfirm={(obs) => negar(negarTarget.id, usuario.nome, obs)}
      />
    </div>
  )
}

// ─── Gestão view (audit, read-only) ──────────────────────────
function ViewGestao() {
  const { solicitacoes } = useSolicitacoes()
  const [tab, setTab] = useState('todas')

  const displayed = tab === 'todas'
    ? solicitacoes
    : solicitacoes.filter(s => s.status === tab)

  const counts = {
    pendente: solicitacoes.filter(s => s.status === 'pendente').length,
    aprovada: solicitacoes.filter(s => s.status === 'aprovada').length,
    negada:   solicitacoes.filter(s => s.status === 'negada').length,
    todas:    solicitacoes.length,
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Histórico de Solicitações</h2>
        <p className="text-sm text-gray-500 mt-0.5">Visualização completa para auditoria</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t
                ? 'border-[#990000] text-[#990000]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {TAB_LABELS[t]}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold
              ${tab === t ? 'bg-red-100 text-[#990000]' : 'bg-gray-100 text-gray-500'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader showActions={false} />
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    Nenhuma solicitação nesta categoria.
                  </td>
                </tr>
              ) : (
                displayed.map(s => (
                  <SolRow key={s.id} s={s} showActions={false} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Dentista view ────────────────────────────────────────────
function ViewDentista() {
  const { usuario } = useAuth()
  const { solicitacoes } = useSolicitacoes()
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('todas')

  const minhas = solicitacoes.filter(s => s.solicitante === usuario.nome)
  const displayed = tab === 'todas' ? minhas : minhas.filter(s => s.status === tab)

  const counts = {
    pendente: minhas.filter(s => s.status === 'pendente').length,
    aprovada: minhas.filter(s => s.status === 'aprovada').length,
    negada:   minhas.filter(s => s.status === 'negada').length,
    todas:    minhas.length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Minhas Solicitações</h2>
          <p className="text-sm text-gray-500 mt-0.5">{minhas.length} solicitações no total</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Solicitação
        </Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t
                ? 'border-[#990000] text-[#990000]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {TAB_LABELS[t]}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold
              ${tab === t ? 'bg-red-100 text-[#990000]' : 'bg-gray-100 text-gray-500'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader showActions={false} />
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    Nenhuma solicitação nesta categoria.
                  </td>
                </tr>
              ) : (
                displayed.map(s => (
                  <SolRow key={s.id} s={s} showActions={false} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NovaSolicitacaoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────
export default function Solicitacoes() {
  const { usuario } = useAuth()
  if (usuario?.role === 'gestao') return <ViewGestao />
  if (usuario?.role === 'almoxarife') return <ViewAlmoxarife />
  return <ViewDentista />
}
