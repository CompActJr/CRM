import { useState } from 'react'
import { Trophy, X } from 'lucide-react'
import { ganharNegocio } from '../../services/negociosService'
import { formatValorFromAmount, maskValorInput, parseValorInputToAmount } from '../../utils/currencyInput'
import { hasValidValorEstimado } from '../../utils/funilDrag'

function ModalGanharLead({
  negocio,
  etapaDestinoNome,
  etapaFunilId,
  currentUser,
  onClose,
  onSuccess,
}) {
  const [valorProjeto, setValorProjeto] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const destinoLabel = etapaDestinoNome || 'Pós Venda'
  const tituloNegocio = negocio?.empresa || negocio?.lead || negocio?.titulo || 'Negócio'
  const valorEstimadoAtual = hasValidValorEstimado(negocio?.valorEstimado)
    ? formatValorFromAmount(negocio.valorEstimado)
    : null

  const handleSubmit = async (event) => {
    event.preventDefault()
    const valorFinal = parseValorInputToAmount(valorProjeto)
    if (!valorProjeto || !hasValidValorEstimado(valorFinal)) {
      setError('Informe o valor do projeto maior que zero.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await ganharNegocio(negocio.negocioId ?? negocio.id, {
        valorEstimado: valorFinal,
        ...(etapaFunilId ? { etapaFunilId } : {}),
        ...(currentUser?.id ? { usuarioId: Number(currentUser.id) } : {}),
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
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} style={{ color: '#16a34a' }} />
            <h3 style={{ margin: 0 }}>Ganhar Lead (Conversão Antecipada)</h3>
          </div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <p className="modalHint">
          O negócio <strong>{tituloNegocio}</strong> será convertido diretamente da etapa de{' '}
          <strong>Proposta</strong> para <strong>{destinoLabel}</strong>. Informe o valor final do
          projeto para concluir.
          {valorEstimadoAtual && (
            <>
              {' '}
              Valor estimado atual: <strong>{valorEstimadoAtual}</strong>.
            </>
          )}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="inputGroup fullLine">
            <span>Valor do projeto (R$)</span>
            <input
              type="text"
              inputMode="numeric"
              value={valorProjeto}
              onChange={(event) => setValorProjeto(maskValorInput(event.target.value))}
              placeholder="R$ 0,00"
              autoFocus
              required
            />
          </label>

          {error && <p className="formError">{error}</p>}

          <div className="modalActions">
            <button type="button" className="secondaryBtn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="successBtn" disabled={saving}>
              {saving ? 'Convertendo...' : 'Confirmar e Ir para Pós Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalGanharLead

