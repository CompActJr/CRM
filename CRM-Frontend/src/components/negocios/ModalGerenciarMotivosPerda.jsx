import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import {
  createMotivoPerda,
  deleteMotivoPerda,
  fetchMotivosPerda,
  updateMotivoPerda,
} from '../../services/motivosPerdaService'

function ModalGerenciarMotivosPerda({ onClose, onUpdated }) {
  const [motivos, setMotivos] = useState([])
  const [novoNome, setNovoNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadMotivos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMotivosPerda()
      setMotivos(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMotivos()
  }, [loadMotivos])

  const notifyUpdate = async () => {
    await loadMotivos()
    onUpdated?.()
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    const nome = novoNome.trim()
    if (!nome) return

    setSaving(true)
    setError('')
    try {
      await createMotivoPerda({ nome, ativo: true })
      setNovoNome('')
      await notifyUpdate()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAtivo = async (motivo) => {
    setError('')
    try {
      await updateMotivoPerda(motivo.id, { nome: motivo.nome, ativo: !motivo.ativo })
      await notifyUpdate()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDelete = async (motivo) => {
    const confirmed = window.confirm(`Excluir o motivo "${motivo.nome}"?`)
    if (!confirmed) return

    setError('')
    try {
      await deleteMotivoPerda(motivo.id)
      await notifyUpdate()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="modalOverlay modalOverlayStacked" onClick={onClose}>
      <div className="modalCard modalCardWide" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <h3>Motivos de perda</h3>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <p className="modalHint">
          Cadastre os motivos padronizados. Somente motivos <strong>ativos</strong> aparecem no
          dropdown ao marcar o negócio como perdido.
        </p>

        <form className="motivoInlineForm" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Nome do novo motivo"
            value={novoNome}
            onChange={(event) => setNovoNome(event.target.value)}
            maxLength={120}
          />
          <button type="submit" className="primaryBtn" disabled={saving || !novoNome.trim()}>
            <Plus size={18} />
            Adicionar
          </button>
        </form>

        {error && <p className="formError">{error}</p>}

        <div className="motivoListBox">
          {loading ? (
            <p className="tableMessage">Carregando motivos...</p>
          ) : motivos.length === 0 ? (
            <p className="tableMessage">Nenhum motivo cadastrado.</p>
          ) : (
            <ul className="motivoList">
              {motivos.map((motivo) => (
                <li key={motivo.id} className="motivoListItem">
                  <div className="motivoListInfo">
                    <span>{motivo.nome}</span>
                    <button
                      type="button"
                      className={motivo.ativo ? 'tag ok motivoTagBtn' : 'tag danger motivoTagBtn'}
                      onClick={() => handleToggleAtivo(motivo)}
                    >
                      {motivo.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="iconBtn dangerIcon"
                    onClick={() => handleDelete(motivo)}
                    aria-label={`Excluir ${motivo.nome}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modalActions">
          <button type="button" className="primaryBtn" onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGerenciarMotivosPerda
