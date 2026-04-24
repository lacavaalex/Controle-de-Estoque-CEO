import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ESTOQUE_CEO, getCEOItemStatus, getCEOStatusLabel } from '@/data/data'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import NovaSolicitacaoModal from '@/components/solicitacoes/NovaSolicitacaoModal'

const CARD_STYLES = {
  disponivel:   { border: 'border-green-200', bg: 'bg-green-50', bar: '#16a34a' },
  baixo:        { border: 'border-yellow-200', bg: 'bg-yellow-50', bar: '#d97706' },
  critico:      { border: 'border-red-200', bg: 'bg-red-50', bar: '#dc2626' },
  indisponivel: { border: 'border-gray-200', bg: 'bg-gray-50', bar: '#9ca3af' },
}

// Card view for dentists
function CardView({ items }) {
  const [modalItemId, setModalItemId] = useState(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => {
          const style = CARD_STYLES[item.status]
          const pct = item.estoqueMinimo > 0
            ? Math.min(100, Math.round((item.quantidade / (item.estoqueMinimo * 4)) * 100))
            : item.quantidade > 0 ? 100 : 0

          return (
            <Card key={item.id} className={`p-4 border ${style.border}`}>
              <div className="flex items-start justify-between mb-2">
                <Badge variant={item.status}>{getCEOStatusLabel(item.status)}</Badge>
                <span className="text-xs text-gray-400">{item.categoria}</span>
              </div>
              <p className="font-bold text-gray-900 text-base leading-tight">{item.nome}</p>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-gray-900">{item.quantidade}</span>
                <span className="text-sm text-gray-500 mb-0.5">{item.unidade}</span>
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: style.bar }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Mín: {item.estoqueMinimo} {item.unidade}</p>
              <Button
                className="w-full mt-3"
                size="sm"
                disabled={item.status === 'indisponivel'}
                onClick={() => setModalItemId(item.itemId)}
              >
                {item.status === 'indisponivel' ? 'Indisponível' : 'Solicitar Item'}
              </Button>
            </Card>
          )
        })}
      </div>

      <NovaSolicitacaoModal
        isOpen={!!modalItemId}
        onClose={() => setModalItemId(null)}
        preItemId={modalItemId}
      />
    </>
  )
}

// Table view for gestao/almoxarife
function TableView({ items }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Categoria</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qtd</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Mínimo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{item.nome}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.categoria}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-gray-900">{item.quantidade}</span>
                  <span className="text-xs text-gray-400 ml-1">{item.unidade}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                  {item.estoqueMinimo} {item.unidade}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.status}>{getCEOStatusLabel(item.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function EstoqueCEO() {
  const { usuario } = useAuth()
  const items = ESTOQUE_CEO.map(i => ({ ...i, status: getCEOItemStatus(i) }))

  const criticos = items.filter(i => ['critico', 'indisponivel'].includes(i.status)).length
  const baixo = items.filter(i => i.status === 'baixo').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Estoque — CEO</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} itens · {criticos > 0 && <span className="text-red-500 font-semibold">{criticos} críticos</span>}
            {criticos > 0 && baixo > 0 && ' · '}
            {baixo > 0 && <span className="text-yellow-600 font-semibold">{baixo} com estoque baixo</span>}
          </p>
        </div>
      </div>

      {/* Conditional view */}
      {usuario?.role === 'dentista' ? (
        <CardView items={items} />
      ) : (
        <TableView items={items} />
      )}
    </div>
  )
}
