import { useCallback, useEffect, useState } from 'react'
import { Settings2, X } from 'lucide-react'
import ModalGerenciarMotivosPerda from './ModalGerenciarMotivosPerda'
import { fetchMotivosPerda } from '../../services/motivosPerdaService'
import { marcarNegocioPerdida } from '../../services/negociosService'
import { mudarEtapaLead } from '../../services/leadsService'
import { hasValidValorEstimado } from '../../utils/funilDrag'

function ModalMarcarPerdida({ negocio, currentUser, onClose, onSuccess }) {
  const [motivos, setMotivos] = useState([])
  const [motivoPerdaId, setMotivoPerdaId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showGerenciar, setShowGerenciar] = useState(false)

  const isAdmin = currentUser?.perfilAcesso === 'Administrador'
  const isLead = negocio?.tipoCard === 'lead'
  const isNegocioSemValor = !isLead && !hasValidValorEstimado(negocio?.valorEstimado)

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
    if (isNegocioSemValor) {
      setError('Preencha o valor estimado do negócio antes de marcá-lo como perdido.')
      return
    }
    if (!motivoPerdaId) {
      setError('Selecione um motivo de perda')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isLead) {
        await mudarEtapaLead(negocio.leadId, {
          motivoPerdaId: Number(motivoPerdaId),
          status: 'Inativo',
        })
      } else {
        await marcarNegocioPerdida(negocio.id, {
          motivoPerdaId: Number(motivoPerdaId),
          usuarioId: currentUser?.id,
          ...(typeof negocio?.valorEstimado === 'number'
            ? { valorEstimado: negocio.valorEstimado }
            : {}),
        })
      }
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
            <h3>{negocio.tipoCard === 'lead' ? 'Desqualificar Lead' : 'Marcar negócio como perdido'}</h3>
            <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          <p className="modalHint">
            {negocio.tipoCard === 'lead' ? (
              <>O lead <strong>{negocio.titulo}</strong> será desqualificado e marcado como inativo no CRM.</>
            ) : (
              <>O negócio <strong>{negocio.titulo}</strong> será marcado como perdido. A etapa atual do funil será mantida.</>
            )}
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

            {isNegocioSemValor && (
              <p className="formError">
                Preencha o valor estimado do negócio antes de marcá-lo como perdido.
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
                disabled={saving || loading || motivos.length === 0 || isNegocioSemValor}
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
