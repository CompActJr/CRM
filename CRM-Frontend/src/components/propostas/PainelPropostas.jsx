import { useCallback, useEffect, useState } from 'react'
import { Download, Edit, PenLine, Plus, Trash2, X } from 'lucide-react'
import {
  createProposta,
  deleteProposta,
  downloadPropostaPdf,
  fetchPropostasByNegocio,
  updateProposta,
} from '../../services/propostasService'
import { fetchUsuariosOpcoes } from '../../services/usuariosService'
import { formatValorFromAmount, maskValorInput, parseValorInputToAmount } from '../../utils/currencyInput'

const PropostaStatusOptions = [
  { value: 'Rascunho', label: 'Rascunho' },
  { value: 'Enviada', label: 'Enviada' },
  { value: 'EmNegociacao', label: 'Em negociação' },
  { value: 'Aceita', label: 'Aceita' },
  { value: 'Recusada', label: 'Recusada' },
]

const buildEmptyForm = (currentUser) => ({
  titulo: '',
  valor: '',
  status: 'Rascunho',
  dataProposta: new Date().toISOString().slice(0, 10),
  usuarioId: currentUser?.id ? String(currentUser.id) : '',
  observacoes: '',
})

const getStatusTagClass = (statusDb) => {
  if (statusDb === 'Aceita') return 'tag ok'
  if (statusDb === 'Recusada') return 'tag danger'
  if (statusDb === 'Enviada' || statusDb === 'EmNegociacao') return 'tag'
  return 'tag'
}

const brDateToInput = (brDate) => {
  if (!brDate) return ''
  const [day, month, year] = brDate.split('/')
  if (!day || !month || !year) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const buildFormFromProposta = (proposta, currentUser) => ({
  titulo: proposta.titulo ?? '',
  valor: formatValorFromAmount(proposta.valorNumerico),
  status: proposta.statusDb ?? 'Rascunho',
  dataProposta: brDateToInput(proposta.dataProposta) || new Date().toISOString().slice(0, 10),
  usuarioId: String(proposta.usuarioId ?? currentUser?.id ?? ''),
  observacoes: proposta.observacoes ?? '',
})

function PainelPropostas({ negocioId, currentUser, onPropostasChange }) {
  const [propostas, setPropostas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState(buildEmptyForm(currentUser))
  const [editingId, setEditingId] = useState(null)
  const [formTab, setFormTab] = useState('dados')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [error, setError] = useState('')

  const loadPropostas = useCallback(async () => {
    if (!negocioId) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchPropostasByNegocio(negocioId)
      setPropostas(data)
      onPropostasChange?.(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    loadPropostas()
  }, [loadPropostas])

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const data = await fetchUsuariosOpcoes()
        setUsuarios(data)
      } catch {
        setUsuarios([])
      }
    }
    loadUsuarios()
  }, [])

  useEffect(() => {
    if (!editingId) {
      setForm(buildEmptyForm(currentUser))
    }
  }, [currentUser, editingId])

  const resetForm = () => {
    setForm(buildEmptyForm(currentUser))
    setEditingId(null)
    setFormTab('dados')
    setShowForm(false)
  }

  const openNewForm = () => {
    if (showForm && !editingId) {
      resetForm()
      return
    }
    setEditingId(null)
    setFormTab('dados')
    setForm(buildEmptyForm(currentUser))
    setShowForm(true)
  }

  const openEditForm = (proposta) => {
    setEditingId(proposta.id)
    setFormTab('dados')
    setForm(buildFormFromProposta(proposta, currentUser))
    setShowForm(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleValorChange = (event) => {
    setForm((previous) => ({ ...previous, valor: maskValorInput(event.target.value) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        titulo: form.titulo,
        valor: parseValorInputToAmount(form.valor),
        status: form.status,
        dataProposta: form.dataProposta,
        usuarioId: Number(form.usuarioId),
        observacoes: form.observacoes,
      }
      if (editingId) {
        await updateProposta(editingId, payload)
      } else {
        await createProposta(negocioId, payload)
      }
      resetForm()
      await loadPropostas()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (proposta) => {
    const confirmed = window.confirm(`Excluir a proposta "${proposta.titulo}"?`)
    if (!confirmed) return
    setError('')
    try {
      await deleteProposta(proposta.id)
      await loadPropostas()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDownloadPdf = async (proposta) => {
    if (downloadingId) return
    setDownloadingId(proposta.id)
    setError('')
    try {
      await downloadPropostaPdf(proposta.id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="leadTabContent">
      <div className="leadActionBar">
        <button type="button" className="primaryBtn" onClick={openNewForm}>
          <Plus size={18} />
          {showForm && !editingId ? 'Fechar formulário' : 'Nova proposta'}
        </button>
      </div>

      {showForm && (
        <form className="propostaForm" onSubmit={handleSubmit}>
          <div className="leadTabs propostaFormTabs">
            <button
              type="button"
              className={formTab === 'dados' ? 'leadTab active' : 'leadTab'}
              onClick={() => setFormTab('dados')}
            >
              Dados
            </button>
            <button
              type="button"
              className={formTab === 'observacoes' ? 'leadTab active' : 'leadTab'}
              onClick={() => setFormTab('observacoes')}
            >
              Observações
            </button>
          </div>

          {formTab === 'dados' && (
            <div className="interacaoForm formGrid">
              <label className="inputGroup">
                <span>Título</span>
                <input name="titulo" value={form.titulo} onChange={handleChange} required />
              </label>
              <label className="inputGroup">
                <span>Valor</span>
                <input
                  name="valor"
                  value={form.valor}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  required
                />
              </label>
              <label className="inputGroup">
                <span>Data</span>
                <input
                  type="date"
                  name="dataProposta"
                  value={form.dataProposta}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="inputGroup">
                <span>Status</span>
                <select name="status" value={form.status} onChange={handleChange} required>
                  {PropostaStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inputGroup">
                <span>Responsável</span>
                <select name="usuarioId" value={form.usuarioId} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {formTab === 'observacoes' && (
            <div className="interacaoForm formGrid">
              <label className="inputGroup fullLine">
                <span>Observações da proposta</span>
                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Condições comerciais, escopo, prazos, observações para o cliente..."
                />
              </label>
            </div>
          )}

          <div className="entityFormActions propostaFormActions">
            <button type="button" className="secondaryBtn" onClick={resetForm}>
              <X size={18} />
              Cancelar
            </button>
            <button type="submit" className="primaryBtn" disabled={saving}>
              <PenLine size={18} />
              {saving ? 'Salvando...' : editingId ? 'Atualizar proposta' : 'Salvar proposta'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="formError">{error}</p>}

      {loading ? (
        <p className="tableMessage">Carregando propostas...</p>
      ) : propostas.length === 0 ? (
        <p className="tableMessage">Nenhuma proposta cadastrada.</p>
      ) : (
        <div className="tableCard">
          <table>
            <thead>
              <tr>
                <th>Proposta</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((proposta) => (
                <tr key={proposta.id}>
                  <td>{proposta.titulo}</td>
                  <td>{proposta.dataProposta}</td>
                  <td>{proposta.valor}</td>
                  <td>
                    <span className={getStatusTagClass(proposta.statusDb)}>{proposta.status}</span>
                  </td>
                  <td className="actions">
                    <Download size={16} onClick={() => handleDownloadPdf(proposta)} />
                    <Edit size={16} onClick={() => openEditForm(proposta)} />
                    <Trash2 size={16} onClick={() => handleDelete(proposta)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PainelPropostas
