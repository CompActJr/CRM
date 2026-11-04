import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function FunilCardArrastavel({
  negocio,
  onViewNegocio,
  onEditNegocio,
  onViewLead,
  onEditLead,
}) {
  const isLead = negocio.tipoCard === 'lead'
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
        {negocio.diasNaEtapa !== undefined && (
          <div
            className={`stageTimeTag ${negocio.diasNaEtapa >= 7
              ? 'frio'
              : negocio.diasNaEtapa >= 5
                ? 'morno'
                : 'quente'
              }`}
            style={{ marginBottom: '8px' }}
          >
            {negocio.diasNaEtapa >= 7
              ? `Frio ${negocio.diasNaEtapa >= 1 ? `(${negocio.diasNaEtapa} dias)` : ''}`
              : negocio.diasNaEtapa >= 5
                ? `Morno ${negocio.diasNaEtapa >= 1 ? `(${negocio.diasNaEtapa} dias)` : ''}`
                : `Quente ${negocio.diasNaEtapa >= 1 ? `(${negocio.diasNaEtapa} dias)` : ''}`}
          </div>
        )}
        {isLead && (
          <div style={{ marginBottom: '6px' }}>
            <span className="tag admin" style={{ fontSize: '11px', padding: '2px 8px' }}>
              Lead
            </span>
          </div>
        )}
        <h3>{negocio.titulo}</h3>
        {negocio.empresa && negocio.empresa !== negocio.lead && (
          <p>{negocio.empresa}</p>
        )}
        {!isLead && <p>{negocio.lead}</p>}
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
