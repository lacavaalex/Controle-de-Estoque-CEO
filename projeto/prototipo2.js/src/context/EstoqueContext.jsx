import { createContext, useContext, useState } from 'react'
import { ITEMS } from '@/data/data'

const EstoqueContext = createContext(null)

export function EstoqueProvider({ children }) {
  const [items, setItems] = useState(() => ITEMS.map(i => ({ ...i })))
  const [nextId, setNextId] = useState(() => Math.max(...ITEMS.map(i => i.id)) + 1)

  function addItem(data) {
    const novo = { ...data, id: nextId }
    setItems(prev => [...prev, novo])
    setNextId(n => n + 1)
  }

  function updateItem(id, data) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <EstoqueContext.Provider value={{ items, addItem, updateItem, removeItem }}>
      {children}
    </EstoqueContext.Provider>
  )
}

export function useEstoque() {
  const ctx = useContext(EstoqueContext)
  if (!ctx) throw new Error('useEstoque deve ser usado dentro de EstoqueProvider')
  return ctx
}
