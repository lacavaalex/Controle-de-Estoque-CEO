import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function NegarModal({ isOpen, onClose, solicitacao, onConfirm }) {
  const [observacao, setObservacao] = useState('')

  function handleConfirm() {
    onConfirm(observacao)
    setObservacao('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Negar Solicitação" size="sm">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-gray-800">{solicitacao?.itemNome}</p>
          <p className="text-gray-500 mt-0.5">Solicitado por {solicitacao?.solicitante}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Observação (opcional)</label>
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#990000] focus:border-transparent resize-none"
            rows={3}
            placeholder="Informe o motivo da negação..."
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" type="button" onClick={handleConfirm}>Confirmar Negação</Button>
        </div>
      </div>
    </Modal>
  )
}
