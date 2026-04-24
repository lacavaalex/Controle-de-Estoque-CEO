import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSolicitacoes } from '@/context/SolicitacoesContext'
import { useEstoque } from '@/context/EstoqueContext'
import { ESTOQUE_CEO, getItemStatus, getCEOItemStatus, getCEOStatusLabel } from '@/data/data'
import KpiCard from '@/components/dashboard/KpiCard'
import ConsumoChart from '@/components/dashboard/ConsumoChart'
import ExpiryList from '@/components/dashboard/ExpiryList'
import CriticalStockList from '@/components/dashboard/CriticalStockList'
import MovementLog from '@/components/dashboard/MovementLog'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import NovaSolicitacaoModal from '@/components/solicitacoes/NovaSolicitacaoModal'
import NegarModal from '@/components/solicitacoes/NegarModal'

// ─── Dashboard Gestão ─────────────────────────────────────────
function DashboardGestao() {
  const { solicitacoes } = useSolicitacoes()
  const { items } = useEstoque()
  const itemsComStatus = items.map(i => ({ ...i, status: getItemStatus(i) }))
  const vencendo = itemsComStatus.filter(i => ['vencendo30', 'vencendo60', 'vencido'].includes(i.status)).length
  const critico = itemsComStatus.filter(i => i.status === 'critico').length
  const pendentes = solicitacoes.filter(s => s.status === 'pendente').length

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Itens" value={items.length} subtitle="na Dispensação" accentColor="#990000"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg>} />
        <KpiCard title="Vencendo em Breve" value={vencendo} subtitle="próx. 60 dias" accentColor="#d97706"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KpiCard title="Estoque Crítico" value={critico} subtitle="abaixo do mínimo" accentColor="#dc2626"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        <KpiCard title="Solicitações Pendentes" value={pendentes} subtitle="aguardando revisão" accentColor="#d97706"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
      </div>

      {/* Chart */}
      <ConsumoChart />

      {/* Lists row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpiryList />
        <CriticalStockList />
      </div>

      {/* Movement log */}
      <MovementLog limit={10} />
    </div>
  )
}

// ─── Dashboard Almoxarife ─────────────────────────────────────
function DashboardAlmoxarife() {
  const { solicitacoes, aprovar, negar } = useSolicitacoes()
  const { usuario } = useAuth()
  const { items } = useEstoque()
  const [negarTarget, setNegarTarget] = useState(null)

  const itemsComStatus = items.map(i => ({ ...i, status: getItemStatus(i) }))
  const baixo = itemsComStatus.filter(i => ['critico', 'baixo'].includes(i.status)).length
  const vencendo = itemsComStatus.filter(i => ['vencendo30', 'vencendo60', 'vencido'].includes(i.status)).length
  const pendentes = solicitacoes.filter(s => s.status === 'pendente')

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Itens" value={items.length} subtitle="na Dispensação" accentColor="#990000" />
        <KpiCard title="Estoque Baixo/Crítico" value={baixo} subtitle="requer atenção" accentColor="#dc2626" />
        <KpiCard title="Vencendo em Breve" value={vencendo} subtitle="próx. 60 dias" accentColor="#d97706" />
        <KpiCard title="Pendentes" value={pendentes.length} subtitle={pendentes.length > 0 ? 'aguardando aprovação' : 'tudo em dia'} accentColor={pendentes.length > 0 ? '#d97706' : '#16a34a'} />
      </div>

      {/* Pending requests */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          Fila de Solicitações Pendentes
          {pendentes.length > 0 && (
            <span className="ml-auto text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
              {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
            </span>
          )}
        </h3>

        {pendentes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Nenhuma solicitação pendente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Solicitante</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Justificativa</th>
                  <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</th>
                  <th className="text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-gray-800">{s.solicitante}</p>
                      <p className="text-xs text-gray-400">{s.cargo}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-gray-800">{s.itemNome}</p>
                      <p className="text-xs text-gray-500">{s.quantidadeSolicitada} {s.unidade}</p>
                    </td>
                    <td className="py-3 pr-3 hidden md:table-cell max-w-xs">
                      <p className="text-xs text-gray-500 line-clamp-2">{s.justificativa}</p>
                    </td>
                    <td className="py-3 pr-3 text-xs text-gray-400">
                      {new Date(s.dataSolicitacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => aprovar(s.id, usuario.nome)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setNegarTarget(s)}
                        >
                          Negar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick critical stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpiryList />
        <CriticalStockList />
      </div>

      <NegarModal
        isOpen={!!negarTarget}
        onClose={() => setNegarTarget(null)}
        solicitacao={negarTarget}
        onConfirm={(obs) => negar(negarTarget.id, usuario.nome, obs)}
      />
    </div>
  )
}

// ─── Dashboard Dentista ───────────────────────────────────────
function DashboardDentista() {
  const { usuario } = useAuth()
  const { solicitacoes } = useSolicitacoes()
  const [showModal, setShowModal] = useState(false)

  const minhasSolicitacoes = solicitacoes.filter(s => s.solicitante === usuario.nome)
  const pendentes = minhasSolicitacoes.filter(s => s.status === 'pendente').length

  const ceoStatus = ESTOQUE_CEO.map(i => ({ ...i, status: getCEOItemStatus(i) }))

  const statusColors = {
    disponivel:   'border-l-green-400 bg-green-50',
    baixo:        'border-l-yellow-400 bg-yellow-50',
    critico:      'border-l-red-400 bg-red-50',
    indisponivel: 'border-l-gray-300 bg-gray-50',
  }

  return (
    <div className="space-y-6">
      {/* Header greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Olá, {usuario.nome.split(' ')[1]} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">{usuario.unidade}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Solicitação
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="Itens no CEO" value={ESTOQUE_CEO.length} subtitle="disponíveis para consulta" accentColor="#990000" />
        <KpiCard title="Minhas Solicitações" value={pendentes} subtitle="aguardando aprovação" accentColor={pendentes > 0 ? '#d97706' : '#16a34a'} />
      </div>

      {/* CEO stock cards */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Estoque do CEO — Visão Geral</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ceoStatus.map(item => (
            <div
              key={item.id}
              className={`border-l-4 rounded-lg p-3 ${statusColors[item.status]}`}
            >
              <p className="text-sm font-semibold text-gray-800">{item.nome}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.categoria}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-black text-gray-900">{item.quantidade}</span>
                <span className="text-xs text-gray-500">{item.unidade}</span>
              </div>
              <Badge variant={item.status} className="mt-2">{getCEOStatusLabel(item.status)}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* My requests */}
      {minhasSolicitacoes.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Minhas Solicitações Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Qtd</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {minhasSolicitacoes.slice(0, 5).map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-800">{s.itemNome}</td>
                    <td className="py-2 pr-3 text-gray-500">{s.quantidadeSolicitada} {s.unidade}</td>
                    <td className="py-2 pr-3 text-xs text-gray-400">{new Date(s.dataSolicitacao).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2">
                      <Badge variant={s.status}>
                        {{ pendente: 'Pendente', aprovada: 'Aprovada', negada: 'Negada' }[s.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NovaSolicitacaoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────
export default function Dashboard() {
  const { usuario } = useAuth()
  if (usuario?.role === 'gestao') return <DashboardGestao />
  if (usuario?.role === 'almoxarife') return <DashboardAlmoxarife />
  return <DashboardDentista />
}
