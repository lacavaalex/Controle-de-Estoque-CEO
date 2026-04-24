import Card from '@/components/ui/Card'

export default function KpiCard({ title, value, subtitle, accentColor = '#990000', icon }) {
  return (
    <Card className={`p-5 border-l-4`} style={{ borderLeftColor: accentColor }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-3xl font-black text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-lg" style={{ backgroundColor: accentColor + '15' }}>
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
