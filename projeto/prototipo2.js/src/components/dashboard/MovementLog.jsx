import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { MOVIMENTACOES } from '@/data/data'

const TIPO_LABELS = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' }

export default function MovementLog({ limit = 10 }) {
  const movs = [...MOVIMENTACOES]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, limit)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
        Últimas Movimentações
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</th>
              <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</th>
              <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Destino</th>
              <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Responsável</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</th>
            </tr>
          </thead>
          <tbody>
            {movs.map(mov => (
              <tr key={mov.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-3">
                  <Badge variant={mov.tipo}>{TIPO_LABELS[mov.tipo]}</Badge>
                </td>
                <td className="py-2 pr-3">
                  <p className="font-medium text-gray-800">{mov.itemNome}</p>
                  <p className="text-xs text-gray-400">{mov.quantidade > 0 ? '+' : ''}{mov.quantidade} {mov.unidade}</p>
                </td>
                <td className="py-2 pr-3 hidden md:table-cell">
                  <span className="text-gray-600 text-xs">{mov.destino}</span>
                </td>
                <td className="py-2 pr-3 hidden lg:table-cell">
                  <span className="text-gray-500 text-xs">{mov.responsavel}</span>
                </td>
                <td className="py-2 text-right text-xs text-gray-400">
                  {new Date(mov.data).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
