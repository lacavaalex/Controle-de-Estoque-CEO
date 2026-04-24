import { createContext, useContext, useState } from 'react'
import { SOLICITACOES_INICIAIS, TODAY } from '@/data/data'

const SolicitacoesContext = createContext(null)

export function SolicitacoesProvider({ children }) {
  const [solicitacoes, setSolicitacoes] = useState([...SOLICITACOES_INICIAIS])

  function aprovar(id, responsavel) {
    setSolicitacoes(prev =>
      prev.map(s =>
        s.id === id
          ? {
              ...s,
              status: 'aprovada',
              responsavel,
              dataConclusao: TODAY.toISOString().slice(0, 10),
            }
          : s
      )
    )
  }

  function negar(id, responsavel, observacao = '') {
    setSolicitacoes(prev =>
      prev.map(s =>
        s.id === id
          ? {
              ...s,
              status: 'negada',
              responsavel,
              dataConclusao: TODAY.toISOString().slice(0, 10),
              observacao,
            }
          : s
      )
    )
  }

  function criar(nova) {
    setSolicitacoes(prev => {
      const newId = `SOL-${String(prev.length + 1).padStart(3, '0')}`
      return [
        {
          ...nova,
          id: newId,
          status: 'pendente',
          dataSolicitacao: TODAY.toISOString().slice(0, 10),
          dataConclusao: null,
          responsavel: null,
          observacao: null,
        },
        ...prev,
      ]
    })
  }

  return (
    <SolicitacoesContext.Provider value={{ solicitacoes, aprovar, negar, criar }}>
      {children}
    </SolicitacoesContext.Provider>
  )
}

export function useSolicitacoes() {
  const ctx = useContext(SolicitacoesContext)
  if (!ctx) throw new Error('useSolicitacoes deve ser usado dentro de SolicitacoesProvider')
  return ctx
}
