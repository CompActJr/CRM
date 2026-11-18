import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Eye } from 'lucide-react'
import {
  getFunilCardDisplayTitle,
  getTemperaturaInfo,
  isEtapaVendida,
  isTituloGenerico,
} from '../../utils/funilDrag'

function FunilCardArrastavel({
  negocio,
  etapa,
  isMinimized = false,
  onViewNegocio,
  onEditNegocio,
  onViewLead,
  onEditLead,
}) {
  const isLead = negocio.tipoCard === 'lead'
  const isVendido = isEtapaVendida(etapa || negocio.etapa)
  const temperatura = getTemperaturaInfo(negocio.diasNaEtapa)
  const displayTitle = getFunilCardDisplayTitle(negocio)
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
      className={`opCard ${isMinimized ? 'opCardMinimized' : ''} ${isDragging ? 'opCardDragging' : ''}`}
    >
      {isMinimized ? (
        <div className="opCardMiniRow">
          <div className="opCardDragHandle opCardMiniContent" {...listeners} {...attributes}>
            {!isVendido && negocio.diasNaEtapa !== undefined && (
              <span
                className={`opCardTempDot ${temperatura.key}`}
                title={temperatura.label}
              />
            )}
            <div className="opCardMiniText">
              <strong className="opCardMiniTitle" title={displayTitle}>
                {displayTitle}
              </strong>
              {(negocio.valor || isLead) && (
                <span className="opCardMiniMeta">
                  {isLead ? 'Lead' : negocio.valor}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="iconBtn opCardMiniViewBtn"
            title="Visualizar"
            aria-label={`Visualizar ${displayTitle}`}
            onClick={() => (isLead && onViewLead ? onViewLead(negocio.leadId) : onViewNegocio(negocio.id))}
          >
            <Eye size={15} />
          </button>
        </div>
      ) : (
        <>
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
            <h3>{displayTitle}</h3>
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
        </>
      )}
    </div>
  )
}

export default FunilCardArrastavel
