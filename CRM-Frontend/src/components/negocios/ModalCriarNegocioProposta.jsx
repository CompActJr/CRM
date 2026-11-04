import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { createNegocio } from '../../services/negociosService'
import { maskValorInput, parseValorInputToAmount } from '../../utils/currencyInput'
import SearchableSelect from '../common/SearchableSelect'

function ModalCriarNegocioProposta({
  lead,
  etapaDestino,
  etapaFunilId,
  users = [],
  currentUser,
  onClose,
  onSuccess,
}) {
  const initialUserIds = lead.usuarioId
    ? [Number(lead.usuarioId)]
    : currentUser?.id
      ? [Number(currentUser.id)]
      : []

  const [titulo, setTitulo] = useState(`Negócio - ${lead.empresa || lead.nome}`)
  const [valorEstimado, setValorEstimado] = useState('')
  const [responsaveisIds, setResponsaveisIds] = useState(initialUserIds)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!titulo.trim()) {
      setError('Informe um título para o negócio.')
      return
    }
    if (!valorEstimado || parseValorInputToAmount(valorEstimado) <= 0) {
      setError('Informe um valor estimado válido para a proposta.')
      return
    }
    if (!responsaveisIds || responsaveisIds.length === 0) {
      setError('Selecione pelo menos um responsável.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createNegocio({
        leadId: lead.leadId,
        titulo: titulo.trim(),
        valorEstimado: parseValorInputToAmount(valorEstimado),
        responsaveisIds,
        etapaFunilId,
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
      <div className="modalCard" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modalHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={22} style={{ color: '#0284c7' }} />
            <h3 style={{ margin: 0 }}>Criar Negócio na Fase de {etapaDestino}</h3>
          </div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <p className="modalHint">
          O lead <strong>{lead.lead || lead.titulo}</strong> foi qualificado e será promovido para a etapa de <strong>{etapaDestino}</strong> como um negócio ativo com valor financeiro.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="inputGroup fullLine">
            <span>Título do negócio</span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Ex.: Negócio - Empresa Exemplo"
            />
          </label>

          <label className="inputGroup fullLine">
            <span>Valor estimado da proposta (R$)</span>
            <input
              type="text"
              value={valorEstimado}
              onChange={(e) => setValorEstimado(maskValorInput(e.target.value))}
              required
              placeholder="R$ 0,00"
            />
          </label>

          <div className="inputGroup fullLine">
            <SearchableSelect
              label="Responsável principal"
              placeholder="Selecione o responsável"
              searchPlaceholder="Buscar responsável..."
              options={users.map((u) => ({
                value: u.id,
                label: u.nome,
              }))}
              value={responsaveisIds[0] ?? ''}
              onChange={(val) => setResponsaveisIds(val ? [Number(val)] : [])}
              required
            />
          </div>

          {error && <p className="formError">{error}</p>}

          <div className="modalActions">
            <button type="button" className="secondaryBtn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primaryBtn" disabled={saving}>
              {saving ? 'Criando negócio...' : 'Criar Negócio e Avançar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalCriarNegocioProposta

