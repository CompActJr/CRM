import { useDroppable } from '@dnd-kit/core'
import FunilCardArrastavel from './FunilCardArrastavel'

function FunilColuna({
  etapa,
  oportunidades,
  isBottleneck,
  isPerdida,
  diasMedios,
  showTempoMedio,
  onViewOportunidade,
  onEditOportunidade,
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
        <span>{oportunidades.length}</span>
      </div>

      {oportunidades.map((oportunidade) => (
        <FunilCardArrastavel
          key={oportunidade.id}
          oportunidade={oportunidade}
          onViewOportunidade={onViewOportunidade}
          onEditOportunidade={onEditOportunidade}
        />
      ))}
    </div>
  )
}

export default FunilColuna
