import { useState } from 'react'
import { X } from 'lucide-react'

const InteracaoTipos = [
  { value: 'Ligacao', label: 'Ligação' },
  { value: 'Email', label: 'E-mail' },
  { value: 'Reuniao', label: 'Reunião' },
  { value: 'Nota', label: 'Nota' },
  { value: 'Registro', label: 'Registro' },
]

const ModalLabels = {
  title: 'Registrar mudança de etapa',
  tipo: 'Tipo da interação',
  data: 'Data da interação',
  descricao: 'Descrição',
  cancelar: 'Cancelar',
  confirmar: 'Confirmar mudança',
  saving: 'Salvando...',
  descricaoRequired: 'Informe a descrição da interação',
}

const toDateTimeLocalValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export const buildMudancaEtapaDescricao = (etapaOrigem, etapaDestino) =>
  `Negócio movido de "${etapaOrigem}" para "${etapaDestino}".`

function ModalMudancaEtapaFunil({
  tituloNegocio,
  etapaOrigem,
  etapaDestino,
  onClose,
  onConfirm,
}) {
  const [tipo, setTipo] = useState('Registro')
  const [descricao, setDescricao] = useState(buildMudancaEtapaDescricao(etapaOrigem, etapaDestino))
  const [dataInteracao, setDataInteracao] = useState(toDateTimeLocalValue())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!descricao.trim()) {
      setError(ModalLabels.descricaoRequired)
      return
    }

    setSaving(true)
    setError('')

    try {
      await onConfirm({
        tipo,
        descricao: descricao.trim(),
        dataInteracao,
      })
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
          <h3>{ModalLabels.title}</h3>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <p className="modalHint">
          O negócio <strong>{tituloNegocio}</strong> será movido de{' '}
          <strong>{etapaOrigem}</strong> para <strong>{etapaDestino}</strong>. Registre a interação
          para a linha do tempo.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <label className="inputGroup">
              <span>{ModalLabels.tipo}</span>
              <select value={tipo} onChange={(event) => setTipo(event.target.value)} required>
                {InteracaoTipos.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="inputGroup">
              <span>{ModalLabels.data}</span>
              <input
                type="datetime-local"
                value={dataInteracao}
                onChange={(event) => setDataInteracao(event.target.value)}
                required
              />
            </label>
            <label className="inputGroup fullLine">
              <span>{ModalLabels.descricao}</span>
              <textarea
                rows={4}
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                required
              />
            </label>
          </div>
          {error && <p className="formError">{error}</p>}
          <div className="modalActions">
            <button type="button" className="secondaryBtn" onClick={onClose}>
              {ModalLabels.cancelar}
            </button>
            <button type="submit" className="primaryBtn" disabled={saving}>
              {saving ? ModalLabels.saving : ModalLabels.confirmar}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalMudancaEtapaFunil
