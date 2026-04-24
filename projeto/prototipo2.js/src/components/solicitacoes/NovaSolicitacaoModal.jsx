import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ESTOQUE_CEO } from '@/data/data'
import { useSolicitacoes } from '@/context/SolicitacoesContext'
import { useAuth } from '@/context/AuthContext'

export default function NovaSolicitacaoModal({ isOpen, onClose, preItemId = null }) {
  const { criar } = useSolicitacoes()
  const { usuario } = useAuth()

  const [itemId, setItemId] = useState(preItemId ? String(preItemId) : '')
  const [quantidade, setQuantidade] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [error, setError] = useState('')

  const itemOptions = ESTOQUE_CEO.map(i => ({ value: String(i.itemId), label: `${i.nome} (${i.quantidade} ${i.unidade} disponíveis)` }))
  const selectedItem = ESTOQUE_CEO.find(i => String(i.itemId) === itemId)

  function handleSubmit(e) {
    e.preventDefault()
    if (!itemId) return setError('Selecione um item.')
    if (!quantidade || Number(quantidade) < 1) return setError('Informe uma quantidade válida.')
    if (justificativa.trim().length < 10) return setError('Justificativa deve ter pelo menos 10 caracteres.')

    criar({
      itemId: Number(itemId),
      itemNome: selectedItem?.nome ?? '',
      solicitante: usuario.nome,
      cargo: usuario.cargo,
      quantidadeSolicitada: Number(quantidade),
      unidade: selectedItem?.unidade ?? '',
      justificativa: justificativa.trim(),
    })

    setItemId('')
    setQuantidade('')
    setJustificativa('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Solicitação de Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Item"
          options={itemOptions}
          placeholder="Selecione o item..."
          value={itemId}
          onChange={e => { setItemId(e.target.value); setError('') }}
        />

        <Input
          label="Quantidade"
          type="number"
          min="1"
          placeholder="Ex: 10"
          value={quantidade}
          onChange={e => { setQuantidade(e.target.value); setError('') }}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Justificativa</label>
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#990000] focus:border-transparent resize-none"
            rows={3}
            placeholder="Descreva a necessidade do item..."
            value={justificativa}
            onChange={e => { setJustificativa(e.target.value); setError('') }}
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Enviar Solicitação</Button>
        </div>
      </form>
    </Modal>
  )
}
