import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getPriorityClass } from '../../utils/priorityClass'

function FunilCardArrastavel({ oportunidade, onViewOportunidade, onEditOportunidade }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(oportunidade.id),
    data: { oportunidade },
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
        {oportunidade.diasNaEtapa !== undefined && (
          <div
            className={`stageTimeTag ${
              oportunidade.diasNaEtapa >= 7
                ? 'frio'
                : oportunidade.diasNaEtapa >= 5
                ? 'morno'
                : 'quente'
            }`}
            style={{ marginBottom: '8px' }}
          >
            {oportunidade.diasNaEtapa >= 7
              ? `Frio ${oportunidade.diasNaEtapa >= 1 ? `(${oportunidade.diasNaEtapa} dias)` : ''}`
              : oportunidade.diasNaEtapa >= 5
              ? `Morno ${oportunidade.diasNaEtapa >= 1 ? `(${oportunidade.diasNaEtapa} dias)` : ''}`
              : `Quente ${oportunidade.diasNaEtapa >= 1 ? `(${oportunidade.diasNaEtapa} dias)` : ''}`}
          </div>
        )}
        <h3>{oportunidade.titulo}</h3>
        <p>{oportunidade.lead}</p>
        {oportunidade.motivoPerda && (
          <p className="opCardMotivoPerda">{oportunidade.motivoPerda}</p>
        )}
        <div className="cardMeta">
          <span>{oportunidade.responsavel}</span>
          <span className={`priority ${getPriorityClass(oportunidade.prioridade)}`}>
            {oportunidade.prioridade}
          </span>
        </div>
        <strong>{oportunidade.valor}</strong>
      </div>
      <div className="opCardActions">
        <button
          type="button"
          className="secondaryBtn opCardActionBtn"
          onClick={() => onViewOportunidade(oportunidade.id)}
        >
          Ver
        </button>
        <button
          type="button"
          className="secondaryBtn opCardActionBtn"
          onClick={() => onEditOportunidade(oportunidade.id)}
        >
          Editar
        </button>
      </div>
    </div>
  )
}

export default FunilCardArrastavel
