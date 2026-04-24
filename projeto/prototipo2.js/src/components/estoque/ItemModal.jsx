import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { CATEGORIAS } from '@/data/data'

const UNIDADES = ['caixa', 'tubo', 'seringa', 'kit', 'pacote', 'rolo', 'unidade', 'frasco', 'bastão', 'folha', 'par']

const EMPTY = {
  nome: '', categoria: '', lote: '', quantidade: '',
  unidade: '', estoqueMinimo: '', estoqueMaximo: '',
  validade: '', localizacao: '', fornecedor: '',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
        {label}{required && <span style={{ color: '#990000', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inp = {
  display: 'block', width: '100%', padding: '8px 10px',
  fontSize: '13px', color: '#111827', backgroundColor: '#fff',
  border: '1px solid #d1d5db', borderRadius: '6px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function ItemModal({ isOpen, onClose, onSave, item = null }) {
  const isEdit = !!item
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm(item
        ? { ...item, quantidade: String(item.quantidade), estoqueMinimo: String(item.estoqueMinimo), estoqueMaximo: String(item.estoqueMaximo) }
        : { ...EMPTY }
      )
      setErrors({})
    }
  }, [isOpen, item])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.nome.trim())          errs.nome = 'Obrigatório'
    if (!form.categoria)            errs.categoria = 'Obrigatório'
    if (!form.lote.trim())          errs.lote = 'Obrigatório'
    if (!form.quantidade || isNaN(Number(form.quantidade)) || Number(form.quantidade) < 0)
                                    errs.quantidade = 'Número válido'
    if (!form.unidade)              errs.unidade = 'Obrigatório'
    if (!form.validade)             errs.validade = 'Obrigatório'
    if (form.estoqueMinimo && isNaN(Number(form.estoqueMinimo)))
                                    errs.estoqueMinimo = 'Número válido'
    if (form.estoqueMaximo && isNaN(Number(form.estoqueMaximo)))
                                    errs.estoqueMaximo = 'Número válido'
    return errs
  }

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      nome: form.nome.trim(),
      categoria: form.categoria,
      lote: form.lote.trim(),
      quantidade: Number(form.quantidade),
      unidade: form.unidade,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      estoqueMaximo: Number(form.estoqueMaximo) || 9999,
      validade: form.validade,
      localizacao: form.localizacao.trim(),
      fornecedor: form.fornecedor.trim(),
    })
    onClose()
  }

  const errStyle = { fontSize: '11px', color: '#dc2626', marginTop: '2px' }
  const inpErr = { ...inp, borderColor: '#fca5a5' }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Item' : 'Novo Item'} size="lg">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Nome — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Nome do item" required>
            <input value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Luvas Descartáveis M" style={errors.nome ? inpErr : inp} />
            {errors.nome && <p style={errStyle}>{errors.nome}</p>}
          </Field>
        </div>

        <Field label="Categoria" required>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
            style={{ ...(errors.categoria ? inpErr : inp), cursor: 'pointer' }}>
            <option value="">Selecione...</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.categoria && <p style={errStyle}>{errors.categoria}</p>}
        </Field>

        <Field label="Lote" required>
          <input value={form.lote} onChange={e => set('lote', e.target.value)}
            placeholder="Ex: LT-2025-001" style={errors.lote ? inpErr : inp} />
          {errors.lote && <p style={errStyle}>{errors.lote}</p>}
        </Field>

        <Field label="Quantidade" required>
          <input type="number" min="0" value={form.quantidade} onChange={e => set('quantidade', e.target.value)}
            placeholder="0" style={errors.quantidade ? inpErr : inp} />
          {errors.quantidade && <p style={errStyle}>{errors.quantidade}</p>}
        </Field>

        <Field label="Unidade" required>
          <select value={form.unidade} onChange={e => set('unidade', e.target.value)}
            style={{ ...(errors.unidade ? inpErr : inp), cursor: 'pointer' }}>
            <option value="">Selecione...</option>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.unidade && <p style={errStyle}>{errors.unidade}</p>}
        </Field>

        <Field label="Estoque Mínimo">
          <input type="number" min="0" value={form.estoqueMinimo} onChange={e => set('estoqueMinimo', e.target.value)}
            placeholder="0" style={errors.estoqueMinimo ? inpErr : inp} />
          {errors.estoqueMinimo && <p style={errStyle}>{errors.estoqueMinimo}</p>}
        </Field>

        <Field label="Estoque Máximo">
          <input type="number" min="0" value={form.estoqueMaximo} onChange={e => set('estoqueMaximo', e.target.value)}
            placeholder="9999" style={errors.estoqueMaximo ? inpErr : inp} />
          {errors.estoqueMaximo && <p style={errStyle}>{errors.estoqueMaximo}</p>}
        </Field>

        <Field label="Validade" required>
          <input type="date" value={form.validade} onChange={e => set('validade', e.target.value)}
            style={errors.validade ? inpErr : inp} />
          {errors.validade && <p style={errStyle}>{errors.validade}</p>}
        </Field>

        <Field label="Localização">
          <input value={form.localizacao} onChange={e => set('localizacao', e.target.value)}
            placeholder="Ex: Prateleira A-1" style={inp} />
        </Field>

        {/* Fornecedor — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Fornecedor">
            <input value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)}
              placeholder="Ex: DistribMed Ltda" style={inp} />
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave}>{isEdit ? 'Salvar Alterações' : 'Adicionar Item'}</Button>
      </div>
    </Modal>
  )
}
