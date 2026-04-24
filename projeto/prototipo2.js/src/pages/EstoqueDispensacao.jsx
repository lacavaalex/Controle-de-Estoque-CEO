import { useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useEstoque } from '@/context/EstoqueContext'
import { CATEGORIAS, getItemStatus, getStatusLabel } from '@/data/data'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ItemModal from '@/components/estoque/ItemModal'

const STATUS_OPTIONS = [
  { value: 'normal',     label: 'Normal' },
  { value: 'baixo',      label: 'Baixo' },
  { value: 'critico',    label: 'Crítico' },
  { value: 'vencendo30', label: 'Vencendo (30d)' },
  { value: 'vencendo60', label: 'Vencendo (60d)' },
  { value: 'vencido',    label: 'Vencido' },
  { value: 'excessivo',  label: 'Excessivo' },
]

const ROW_HIGHLIGHT = {
  critico:    'bg-red-50',
  vencendo30: 'bg-orange-50',
  vencido:    'bg-red-100',
  excessivo:  'bg-blue-50',
}

function ConfirmDelete({ isOpen, onClose, item, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remover Item" size="sm">
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#374151' }}>
          Tem certeza que deseja remover <strong>{item?.nome}</strong> do estoque?
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
          Esta ação não pode ser desfeita.
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={() => { onConfirm(item.id); onClose() }}>
          Remover Item
        </Button>
      </div>
    </Modal>
  )
}

export default function EstoqueDispensacao() {
  const { usuario } = useAuth()
  const { items, addItem, updateItem, removeItem } = useEstoque()

  const [search,       setSearch]       = useState('')
  const [categoria,    setCategoria]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showAdd,         setShowAdd]         = useState(false)
  const [editItem,        setEditItem]        = useState(null)
  const [deleteItem,      setDeleteItem]      = useState(null)

  const canEdit = usuario?.role === 'almoxarife' || usuario?.role === 'gestao'

  const categoriaOptions = CATEGORIAS.map(c => ({ value: c, label: c }))

  const filtered = useMemo(() => {
    return items
      .map(item => ({ ...item, status: getItemStatus(item) }))
      .filter(item => {
        const matchSearch = item.nome.toLowerCase().includes(search.toLowerCase()) ||
          item.lote.toLowerCase().includes(search.toLowerCase())
        const matchCat    = !categoria    || item.categoria === categoria
        const matchStatus = !statusFilter || item.status    === statusFilter
        return matchSearch && matchCat && matchStatus
      })
  }, [items, search, categoria, statusFilter])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Estoque — Dispensação</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} de {items.length} itens exibidos
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAdd(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Item
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Buscar por nome ou lote..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select
            options={categoriaOptions}
            placeholder="Todas as categorias"
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
          />
          <Select
            options={STATUS_OPTIONS}
            placeholder="Todos os status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Lote</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qtd</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Mín / Máx</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Localização</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                {canEdit && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-12 text-center text-gray-400 text-sm">
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const highlight = ROW_HIGHLIGHT[item.status] ?? ''
                  return (
                    <tr key={item.id} className={`border-b border-gray-50 last:border-0 transition-colors hover:brightness-95 ${highlight}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{item.nome}</p>
                        <p className="text-xs text-gray-400">{item.categoria}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500 hidden md:table-cell">{item.lote}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">{item.quantidade}</span>
                        <span className="text-xs text-gray-400 ml-1">{item.unidade}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{item.estoqueMinimo} / {item.estoqueMaximo}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-gray-500">{item.localizacao}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700 font-medium">
                          {new Date(item.validade).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.status}>{getStatusLabel(item.status)}</Badge>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Editar */}
                            <button
                              onClick={() => setEditItem(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {/* Remover */}
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remover item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modais */}
      <ItemModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={data => addItem(data)}
      />

      <ItemModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        onSave={data => updateItem(editItem.id, data)}
      />

      <ConfirmDelete
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        item={deleteItem}
        onConfirm={removeItem}
      />
    </div>
  )
}
