import Card from '@/components/ui/Card'
import { getItemStatus } from '@/data/data'
import { useEstoque } from '@/context/EstoqueContext'

export default function CriticalStockList() {
  const { items } = useEstoque()
  const critical = items
    .map(item => ({ ...item, status: getItemStatus(item) }))
    .filter(item => ['critico', 'baixo', 'excessivo'].includes(item.status))
    .sort((a, b) => {
      const order = { critico: 0, baixo: 1, excessivo: 2 }
      return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    })

  const badgeProps = {
    critico:   { text: 'Crítico', cls: 'text-red-700 bg-red-50' },
    baixo:     { text: 'Baixo',   cls: 'text-yellow-700 bg-yellow-50' },
    excessivo: { text: 'Excessivo', cls: 'text-blue-700 bg-blue-50' },
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Alertas de Estoque
        <span className="ml-auto text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
          {critical.length}
        </span>
      </h3>

      {critical.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Estoque em ordem.</p>
      ) : (
        <ul className="space-y-2">
          {critical.map(item => {
            const bp = badgeProps[item.status]
            const pct = Math.min(100, Math.round((item.quantidade / item.estoqueMaximo) * 100))
            const barColor = item.status === 'critico' ? '#dc2626' : item.status === 'excessivo' ? '#2563eb' : '#d97706'

            return (
              <li key={item.id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{item.nome}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${bp.cls}`}>
                    {bp.text}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 w-20 text-right">
                    {item.quantidade} / {item.estoqueMaximo} {item.unidade}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
