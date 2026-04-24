const VARIANTS = {
  // Item status
  normal:     'bg-green-100 text-green-800',
  baixo:      'bg-yellow-100 text-yellow-800',
  critico:    'bg-red-100 text-red-800',
  vencendo30: 'bg-red-100 text-red-800',
  vencendo60: 'bg-orange-100 text-orange-800',
  vencido:    'bg-red-200 text-red-900',
  excessivo:  'bg-blue-100 text-blue-800',
  // Request status
  pendente:   'bg-yellow-100 text-yellow-800',
  aprovada:   'bg-green-100 text-green-800',
  negada:     'bg-red-100 text-red-800',
  // CEO stock
  disponivel:    'bg-green-100 text-green-800',
  indisponivel:  'bg-gray-200 text-gray-600',
  // Movement type
  entrada:    'bg-green-100 text-green-700',
  saida:      'bg-blue-100 text-blue-700',
  ajuste:     'bg-purple-100 text-purple-700',
  // Role
  gestao:     'bg-red-100 text-red-800',
  almoxarife: 'bg-blue-100 text-blue-800',
  dentista:   'bg-teal-100 text-teal-800',
}

export default function Badge({ variant = 'normal', children, className = '' }) {
  const colors = VARIANTS[variant] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors} ${className}`}>
      {children}
    </span>
  )
}
