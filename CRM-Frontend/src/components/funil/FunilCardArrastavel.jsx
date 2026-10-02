import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getPriorityClass } from '../../utils/priorityClass'

function FunilCardArrastavel({ negocio, onViewNegocio, onEditNegocio }) {
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
        <h3>{negocio.titulo}</h3>
        <p>{negocio.lead}</p>
        {negocio.motivoPerda && (
          <p className="opCardMotivoPerda">{negocio.motivoPerda}</p>
        )}
        <div className="cardMeta">
          <span>{negocio.responsavel}</span>
          <span className={`priority ${getPriorityClass(negocio.prioridade)}`}>
            {negocio.prioridade}
          </span>
        </div>
        <strong>{negocio.valor}</strong>
      </div>
      <div className="opCardActions">
        <button
          type="button"
          className="secondaryBtn opCardActionBtn"
          onClick={() => onViewNegocio(negocio.id)}
        >
          Ver
        </button>
        <button
          type="button"
          className="secondaryBtn opCardActionBtn"
          onClick={() => onEditNegocio(negocio.id)}
        >
          Editar
        </button>
      </div>
    </div>
  )
}

export default FunilCardArrastavel
