import { useCallback, useEffect, useState } from 'react'
import { Settings2, X } from 'lucide-react'
import ModalGerenciarMotivosPerda from './ModalGerenciarMotivosPerda'
import { fetchMotivosPerda } from '../../services/motivosPerdaService'
import { marcarNegocioPerdida } from '../../services/negociosService'

function ModalMarcarPerdida({ negocio, currentUser, onClose, onSuccess }) {
  const [motivos, setMotivos] = useState([])
  const [motivoPerdaId, setMotivoPerdaId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showGerenciar, setShowGerenciar] = useState(false)

  const isAdmin = currentUser?.perfilAcesso === 'Administrador'

  const loadMotivos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMotivosPerda(true)
      setMotivos(data)
      setMotivoPerdaId((current) => {
        if (current && data.some((item) => String(item.id) === current)) return current
        return ''
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMotivos()
  }, [loadMotivos])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!motivoPerdaId) {
      setError('Selecione um motivo de perda')
      return
    }
    setSaving(true)
    setError('')
    try {
      await marcarNegocioPerdida(negocio.id, {
        motivoPerdaId: Number(motivoPerdaId),
        usuarioId: currentUser?.id,
      })
      onSuccess()
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modalOverlay" onClick={onClose}>
        <div className="modalCard" onClick={(event) => event.stopPropagation()}>
          <div className="modalHeader">
            <h3>Marcar negócio como perdido</h3>
            <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          <p className="modalHint">
            O negócio <strong>{negocio.titulo}</strong> será movido para a etapa Perdida.
          </p>
          <form onSubmit={handleSubmit}>
            <label className="inputGroup fullLine">
              <span>Motivo de perda</span>
              {loading ? (
                <p className="tableMessage">Carregando motivos...</p>
              ) : (
                <select
                  value={motivoPerdaId}
                  onChange={(event) => setMotivoPerdaId(event.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {motivos.map((motivo) => (
                    <option key={motivo.id} value={motivo.id}>
                      {motivo.nome}
                    </option>
                  ))}
                </select>
              )}
            </label>

            {isAdmin && (
              <button
                type="button"
                className="linkBtn fullLine"
                onClick={() => setShowGerenciar(true)}
              >
                <Settings2 size={16} />
                Gerenciar motivos de perda
              </button>
            )}

            {motivos.length === 0 && !loading && (
              <p className="formError">
                {isAdmin
                  ? 'Nenhum motivo ativo. Use "Gerenciar motivos de perda" para cadastrar.'
                  : 'Nenhum motivo disponível. Peça ao administrador cadastrar os motivos.'}
              </p>
            )}

            {error && <p className="formError">{error}</p>}
            <div className="modalActions">
              <button type="button" className="secondaryBtn" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="dangerBtn"
                disabled={saving || loading || motivos.length === 0}
              >
                {saving ? 'Salvando...' : 'Confirmar perda'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showGerenciar && isAdmin && (
        <ModalGerenciarMotivosPerda
          onClose={() => setShowGerenciar(false)}
          onUpdated={loadMotivos}
        />
      )}
    </>
  )
}

export default ModalMarcarPerdida
