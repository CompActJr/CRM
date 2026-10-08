import { useCallback, useEffect, useState } from 'react'
import { Check, Edit, Plus, Trash2, X } from 'lucide-react'
import {
  createTarefaForLead,
  createTarefaForNegocio,
  deleteTarefa,
  fetchTarefasByLead,
  fetchTarefasByNegocio,
  toggleTarefaStatus,
  updateTarefa,
} from '../../services/tarefasService'
import { fetchUsuariosOpcoes } from '../../services/usuariosService'

const defaultPrazo = () => {
  const date = new Date()
  date.setDate(date.getDate() + 3)
  return date.toISOString().slice(0, 10)
}

const brDateToInput = (brDate) => {
  if (!brDate) return defaultPrazo()
  const [day, month, year] = brDate.split('/')
  if (!day || !month || !year) return defaultPrazo()
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const buildEmptyForm = (currentUser) => ({
  titulo: '',
  descricao: '',
  dataPrazo: defaultPrazo(),
  usuarioId: currentUser?.id ? String(currentUser.id) : '',
})

const buildFormFromTarefa = (tarefa, currentUser) => ({
  titulo: tarefa.titulo ?? '',
  descricao: tarefa.descricao ?? '',
  dataPrazo: brDateToInput(tarefa.dataPrazo),
  usuarioId: String(tarefa.usuarioId ?? currentUser?.id ?? ''),
})

function PainelTarefas({ leadId, negocioId, currentUser }) {
  const [tarefas, setTarefas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState(buildEmptyForm(currentUser))
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadTarefas = useCallback(async () => {
    if (!leadId && !negocioId) return
    setLoading(true)
    setError('')
    try {
      const data = negocioId
        ? await fetchTarefasByNegocio(negocioId)
        : await fetchTarefasByLead(leadId, { apenasLead: true })
      setTarefas(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [leadId, negocioId])

  useEffect(() => {
    loadTarefas()
  }, [loadTarefas])

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
    setShowForm(false)
  }

  const openNewForm = () => {
    if (showForm && !editingId) {
      resetForm()
      return
    }
    setEditingId(null)
    setForm(buildEmptyForm(currentUser))
    setShowForm(true)
  }

  const openEditForm = (tarefa) => {
    setEditingId(tarefa.id)
    setForm(buildFormFromTarefa(tarefa, currentUser))
    setShowForm(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        dataPrazo: form.dataPrazo,
        usuarioId: Number(form.usuarioId),
      }
      if (editingId) {
        await updateTarefa(editingId, payload)
      } else if (negocioId) {
        await createTarefaForNegocio(negocioId, payload)
      } else {
        await createTarefaForLead(leadId, payload)
      }
      resetForm()
      await loadTarefas()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (tarefa) => {
    setError('')
    try {
      await toggleTarefaStatus(tarefa.id)
      await loadTarefas()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDelete = async (tarefa) => {
    const confirmed = window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)
    if (!confirmed) return
    setError('')
    try {
      await deleteTarefa(tarefa.id)
      if (editingId === tarefa.id) {
        resetForm()
      }
      await loadTarefas()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const pendentes = tarefas.filter((item) => item.statusDb === 'Pendente')
  const concluidas = tarefas.filter((item) => item.statusDb === 'Concluida')

  const renderTarefa = (tarefa) => (
    <li
      key={tarefa.id}
      className={`tarefaListItem ${tarefa.statusDb === 'Concluida' ? 'tarefaConcluida' : ''}`}
    >
      <button
        type="button"
        className={`tarefaCheckBtn ${tarefa.statusDb === 'Concluida' ? 'checked' : ''}`}
        onClick={() => handleToggle(tarefa)}
        aria-label={tarefa.statusDb === 'Concluida' ? 'Marcar pendente' : 'Marcar concluída'}
      >
        <Check size={16} />
      </button>
      <div className="tarefaListBody">
        <div className="tarefaListTop">
          <strong>{tarefa.titulo}</strong>
          <div className="tarefaListTags">
            {tarefa.atrasada && <span className="tag danger">Atrasada</span>}
            <span className={tarefa.statusDb === 'Concluida' ? 'tag ok' : 'tag'}>{tarefa.status}</span>
          </div>
        </div>
        {tarefa.descricao && <p>{tarefa.descricao}</p>}
        <div className="tarefaListMeta">
          <span>Prazo: {tarefa.dataPrazo}</span>
          <span> · {tarefa.responsavel}</span>
          {tarefa.negocioTitulo && <span> · {tarefa.negocioTitulo}</span>}
        </div>
      </div>
      <button
        type="button"
        className="iconBtn"
        onClick={() => openEditForm(tarefa)}
        aria-label={`Editar ${tarefa.titulo}`}
      >
        <Edit size={18} />
      </button>
      <button
        type="button"
        className="iconBtn dangerIcon"
        onClick={() => handleDelete(tarefa)}
        aria-label={`Excluir ${tarefa.titulo}`}
      >
        <Trash2 size={18} />
      </button>
    </li>
  )

  return (
    <div className="leadTabContent">
      <div className="leadActionBar">
        <button type="button" className="secondaryBtn" onClick={openNewForm}>
          <Plus size={18} />
          {showForm && !editingId ? 'Fechar formulário' : 'Nova tarefa'}
        </button>
      </div>

      {showForm && (
        <form className="interacaoForm formGrid" onSubmit={handleSubmit}>
          <label className="inputGroup">
            <span>Título</span>
            <input name="titulo" value={form.titulo} onChange={handleChange} required />
          </label>
          <label className="inputGroup">
            <span>Prazo</span>
            <input
              type="date"
              name="dataPrazo"
              value={form.dataPrazo}
              onChange={handleChange}
              required
            />
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
          <label className={`inputGroup ${negocioId ? '' : 'fullLine'}`}>
            <span>Descrição (opcional)</span>
            <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={3} />
          </label>
          <div className="entityFormActions fullLine">
            {editingId && (
              <button type="button" className="secondaryBtn" onClick={resetForm}>
                <X size={18} />
                Cancelar edição
              </button>
            )}
            <button type="submit" className="primaryBtn" disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar tarefa'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="formError">{error}</p>}

      {loading ? (
        <p className="tableMessage">Carregando tarefas...</p>
      ) : tarefas.length === 0 ? (
        <p className="tableMessage">Nenhuma tarefa registrada.</p>
      ) : (
        <div className="tarefaSections">
          {pendentes.length > 0 && (
            <section>
              <h4 className="tarefaSectionTitle">Pendentes ({pendentes.length})</h4>
              <ul className="tarefaList">{pendentes.map(renderTarefa)}</ul>
            </section>
          )}
          {concluidas.length > 0 && (
            <section>
              <h4 className="tarefaSectionTitle">Concluídas ({concluidas.length})</h4>
              <ul className="tarefaList">{concluidas.map(renderTarefa)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default PainelTarefas
