import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  getFunilCardDisplayTitle,
  getTemperaturaInfo,
  isEtapaVendida,
  isTituloGenerico,
} from '../../utils/funilDrag'

function FunilCardArrastavel({
  negocio,
  etapa,
  onViewNegocio,
  onEditNegocio,
  onViewLead,
  onEditLead,
}) {
  const isLead = negocio.tipoCard === 'lead'
  const isVendido = isEtapaVendida(etapa || negocio.etapa)
  const temperatura = getTemperaturaInfo(negocio.diasNaEtapa)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(negocio.id),
    data: { negocio },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`opCard ${isDragging ? 'opCardDragging' : ''}`}
    >
      <div className="opCardDragHandle" {...listeners} {...attributes}>
        {!isVendido && negocio.diasNaEtapa !== undefined && (
          <div
            className={`stageTimeTag ${temperatura.key}`}
            style={{ marginBottom: '8px' }}
          >
            {temperatura.label}
          </div>
        )}
        {isLead && (
          <div style={{ marginBottom: '6px' }}>
            <span className="tag admin" style={{ fontSize: '11px', padding: '2px 8px' }}>
              Lead
            </span>
          </div>
        )}
        <h3>{getFunilCardDisplayTitle(negocio)}</h3>
        {negocio.empresa && negocio.lead && negocio.empresa !== negocio.lead && (
          <p>{negocio.lead}</p>
        )}
        {!isLead &&
          negocio.titulo &&
          !isTituloGenerico(negocio.titulo) &&
          negocio.titulo !== negocio.empresa &&
          negocio.titulo !== negocio.lead &&
          negocio.titulo !== `Negócio - ${negocio.empresa}` && (
            <p>{negocio.titulo}</p>
        )}
        {negocio.motivoPerda && (
          <p className="opCardMotivoPerda">{negocio.motivoPerda}</p>
        )}
        <div className="cardMeta">
          <span>{negocio.responsavel}</span>
        </div>
        {negocio.valor && <strong>{negocio.valor}</strong>}
      </div>
      <div className="opCardActions">
        <button
          type="button"
          className="secondaryBtn opCardActionBtn"
          onClick={() => (isLead && onViewLead ? onViewLead(negocio.leadId) : onViewNegocio(negocio.id))}
        >
          Ver
        </button>
        <button
          type="button"
          className="secondaryBtn opCardActionBtn"
          onClick={() => (isLead && onEditLead ? onEditLead(negocio.leadId) : onEditNegocio(negocio.id))}
        >
          Editar
        </button>
      </div>
    </div>
  )
}

export default FunilCardArrastavel
