import Card from '@/components/ui/Card'
import { getItemStatus, TODAY } from '@/data/data'
import { useEstoque } from '@/context/EstoqueContext'

function getDaysUntilExpiry(validade) {
  return Math.floor((new Date(validade) - TODAY) / 86400000)
}

export default function ExpiryList() {
  const { items } = useEstoque()
  const expiring = items
    .map(item => ({ ...item, dias: getDaysUntilExpiry(item.validade), status: getItemStatus(item) }))
    .filter(item => ['vencendo30', 'vencendo60', 'vencido'].includes(item.status))
    .sort((a, b) => a.dias - b.dias)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
        Itens Próximos ao Vencimento
        <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
          {expiring.length}
        </span>
      </h3>

      {expiring.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum item próximo ao vencimento.</p>
      ) : (
        <ul className="space-y-2">
          {expiring.map(item => {
            const isVencido = item.dias <= 0
            const isUrgente = item.dias <= 30
            const dotColor = isVencido ? 'bg-red-600' : isUrgente ? 'bg-red-400' : 'bg-orange-400'

            return (
              <li key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                  <p className="text-xs text-gray-400">{item.categoria}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${isVencido ? 'text-red-700' : isUrgente ? 'text-red-500' : 'text-orange-500'}`}>
                    {isVencido ? 'VENCIDO' : `${item.dias}d`}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(item.validade).toLocaleDateString('pt-BR')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
