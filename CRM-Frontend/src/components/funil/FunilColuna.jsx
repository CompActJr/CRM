import { useDroppable } from '@dnd-kit/core'
import FunilCardArrastavel from './FunilCardArrastavel'

function FunilColuna({
  etapa,
  negocios,
  isBottleneck,
  isPerdida,
  diasMedios,
  showTempoMedio,
  onViewNegocio,
  onEditNegocio,
  onViewLead,
  onEditLead,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa,
    data: { etapa },
  })

  return (
    <div
      ref={setNodeRef}
      className={`kanbanCol ${isBottleneck ? 'bottleneck' : ''} ${isPerdida ? 'kanbanColPerdida' : ''} ${isOver ? 'kanbanColOver' : ''}`}
    >
      <div className="kanbanHeader">
        <strong>{etapa}</strong>
        <span>{negocios.length}</span>
      </div>

      {negocios.map((negocio) => (
        <FunilCardArrastavel
          key={negocio.id}
          negocio={negocio}
          onViewNegocio={onViewNegocio}
          onEditNegocio={onEditNegocio}
          onViewLead={onViewLead}
          onEditLead={onEditLead}
        />
      ))}
    </div>
  )
}

export default FunilColuna
