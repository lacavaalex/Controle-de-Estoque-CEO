const VARIANTS = {
  primary:   'text-white shadow-sm hover:opacity-90',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost:     'text-gray-600 hover:bg-gray-100',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success:   'bg-green-600 text-white hover:bg-green-700 shadow-sm',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
  const variantClass = VARIANTS[variant] ?? VARIANTS.primary
  const sizeClass = SIZES[size] ?? SIZES.md
  const style = variant === 'primary' ? { backgroundColor: '#990000', focusRingColor: '#990000' } : {}

  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      style={variant === 'primary' ? { backgroundColor: '#990000' } : {}}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
