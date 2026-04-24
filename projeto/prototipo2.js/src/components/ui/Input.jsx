export default function Input({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`
          w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#990000] focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-400
          transition-shadow
          ${className}
        `}
        {...props}
      />
    </div>
  )
}
