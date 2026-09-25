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
      {showTempoMedio ? (
        <div
          className={`stageTimeTag ${
            diasMedios === null ? 'low' : diasMedios >= 7 ? 'frio' : diasMedios >= 5 ? 'morno' : 'quente'
          }`}
        >
          {diasMedios === null
            ? 'Sem dados'
            : diasMedios >= 7
            ? `Frio ${diasMedios >= 1 ? `(${diasMedios} dias)` : ''}`
            : diasMedios >= 5
            ? `Morno ${diasMedios >= 1 ? `(${diasMedios} dias)` : ''}`
            : `Quente ${diasMedios >= 1 ? `(${diasMedios} dias)` : ''}`}
        </div>
      ) : (
        <div className="stageTimeTag low">{isPerdida ? 'Encerradas' : 'Ganhas'}</div>
      )}
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
