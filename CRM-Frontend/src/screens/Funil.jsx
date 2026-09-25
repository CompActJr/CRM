import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import FiltroResponsavel from '../components/filtros/FiltroResponsavel'
import FunilColuna from '../components/funil/FunilColuna'
import ModalMarcarPerdida from '../components/oportunidades/ModalMarcarPerdida'
import ModalMudancaEtapaFunil from '../components/oportunidades/ModalMudancaEtapaFunil'
import { fetchEtapasFunil } from '../services/etapasService'
import { fetchOportunidadesFunil, updateOportunidade } from '../services/oportunidadesService'
import { createInteracaoForOportunidade } from '../services/interacoesService'
import {
  ETAPA_PERDIDA,
  buildUpdatePayload,
  findEtapaOrigem,
  resolveEtapaDestino,
} from '../utils/funilDrag'
import { getPriorityClass } from '../utils/priorityClass'

const etapasSemTempoMedio = new Set(['Fechado', 'Perdida'])

function FunilOverlayCard({ oportunidade }) {
  return (
    <div className="opCard opCardOverlay">
      
      {/* Etiqueta de Tempo na Etapa */}
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

      {/* Informações da Oportunidade */}
      <h3>{oportunidade.titulo}</h3>
      <p>{oportunidade.lead}</p>
      
      {/* Meta e Prioridade */}
      <div className="cardMeta">
        <span>{oportunidade.responsavel}</span>
        <span className={`priority ${getPriorityClass(oportunidade.prioridade)}`}>
          {oportunidade.prioridade}
        </span>
      </div>

      {/* Valor */}
      <strong>{oportunidade.valor}</strong>
      
    </div>
  );
}

function Funil({ onNewOportunidade, onViewOportunidade, onEditOportunidade, currentUser }) {
  const [funil, setFunil] = useState({})
  const [tempoMedioPorEtapa, setTempoMedioPorEtapa] = useState({})
  const [etapas, setEtapas] = useState([])
  const [responsavelFilter, setResponsavelFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCard, setActiveCard] = useState(null)
  const [perdidaModal, setPerdidaModal] = useState(null)
  const [mudancaEtapaModal, setMudancaEtapaModal] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const loadFunil = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [funilResponse, etapasData] = await Promise.all([
        fetchOportunidadesFunil({ usuarioId: responsavelFilter || undefined }),
        fetchEtapasFunil(),
      ])
      setFunil(funilResponse.funil ?? funilResponse)
      setTempoMedioPorEtapa(funilResponse.tempoMedioPorEtapa ?? {})
      setEtapas(etapasData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [responsavelFilter])

  useEffect(() => {
    loadFunil()
  }, [loadFunil])

  const etapasAtivas = useMemo(() => {
    const ordenadas = etapas.map((etapa) => etapa.nome)
    const extras = Object.keys(funil).filter((nome) => !ordenadas.includes(nome))
    return [...ordenadas, ...extras]
  }, [etapas, funil])

  const etapaIdPorNome = useMemo(() => {
    const map = {}
    for (const etapa of etapas) {
      map[etapa.nome] = etapa.id
    }
    return map
  }, [etapas])

  const bottleneckDays = useMemo(() => {
    return Math.max(
      ...etapasAtivas
        .filter((etapa) => !etapasSemTempoMedio.has(etapa))
        .map((etapa) => tempoMedioPorEtapa[etapa] ?? 0),
      0
    )
  }, [etapasAtivas, tempoMedioPorEtapa])

  const findOportunidade = useCallback(
    (oportunidadeId) => {
      for (const etapa of etapasAtivas) {
        const item = (funil[etapa] ?? []).find((o) => String(o.id) === String(oportunidadeId))
        if (item) return item
      }
      return null
    },
    [funil, etapasAtivas]
  )

  const aplicarMudancaEtapa = useCallback(
    async (oportunidade, etapaOrigem, etapaDestino) => {
      const etapaFunilId = etapaIdPorNome[etapaDestino]
      if (!etapaFunilId) {
        setError('Etapa de destino não encontrada')
        return
      }

      setMudancaEtapaModal({
        oportunidade,
        etapaOrigem,
        etapaDestino,
        etapaFunilId,
      })
    },
    [etapaIdPorNome]
  )

  const handleMudancaEtapaSuccess = async () => {
    setMudancaEtapaModal(null)
    await loadFunil({ silent: true })
  }

  const handleDragStart = (event) => {
    const oportunidade = event.active.data.current?.oportunidade ?? findOportunidade(event.active.id)
    setActiveCard(oportunidade ?? null)
  }

  const handleDragEnd = async (event) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over || mudancaEtapaModal || perdidaModal) return

    const etapaDestino = resolveEtapaDestino(over.id, funil, etapasAtivas)
    const etapaOrigem = findEtapaOrigem(active.id, funil, etapasAtivas)
    if (!etapaDestino || !etapaOrigem || etapaDestino === etapaOrigem) return

    const oportunidade = active.data.current?.oportunidade ?? findOportunidade(active.id)
    if (!oportunidade) return

    if (etapaDestino === ETAPA_PERDIDA) {
      setPerdidaModal({ oportunidade, etapaOrigem })
      return
    }

    await aplicarMudancaEtapa(oportunidade, etapaOrigem, etapaDestino)
  }

  const handlePerdidaSuccess = async () => {
    setPerdidaModal(null)
    await loadFunil()
  }

  return (
    <>
      <Header title="Funil de Vendas" subtitle="Arraste as oportunidades entre as etapas" />
      <div className="toolbar">
        <FiltroResponsavel value={responsavelFilter} onChange={setResponsavelFilter} />
        <button type="button" className="primaryBtn" onClick={onNewOportunidade}>
          <Plus size={18} />
          Nova Oportunidade
        </button>
      </div>
      {error && <p className="formError">{error}</p>}
      {loading ? (
        <p className="tableMessage">Carregando funil...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanbanBoard">
            <section className="kanban">
              {etapasAtivas.map((etapa) => {
                const diasMedios = tempoMedioPorEtapa[etapa] ?? null
                const isPerdida = etapa === ETAPA_PERDIDA
                const isBottleneck =
                  !etapasSemTempoMedio.has(etapa) &&
                  diasMedios !== null &&
                  diasMedios === bottleneckDays &&
                  bottleneckDays > 0

                return (
                  <FunilColuna
                    key={etapa}
                    etapa={etapa}
                    oportunidades={funil[etapa] ?? []}
                    isBottleneck={isBottleneck}
                    isPerdida={isPerdida}
                    diasMedios={diasMedios}
                    showTempoMedio={!etapasSemTempoMedio.has(etapa)}
                    onViewOportunidade={onViewOportunidade}
                    onEditOportunidade={onEditOportunidade}
                  />
                )
              })}
            </section>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCard ? <FunilOverlayCard oportunidade={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      )}
      {perdidaModal && (
        <ModalMarcarPerdida
          oportunidade={perdidaModal.oportunidade}
          currentUser={currentUser}
          onClose={() => setPerdidaModal(null)}
          onSuccess={handlePerdidaSuccess}
        />
      )}
      {mudancaEtapaModal && (
        <ModalMudancaEtapaFunil
          tituloOportunidade={mudancaEtapaModal.oportunidade.titulo}
          etapaOrigem={mudancaEtapaModal.etapaOrigem}
          etapaDestino={mudancaEtapaModal.etapaDestino}
          onClose={() => setMudancaEtapaModal(null)}
          onConfirm={async (interacao) => {
            const { oportunidade, etapaFunilId } = mudancaEtapaModal
            await updateOportunidade(
              oportunidade.id,
              buildUpdatePayload(oportunidade, etapaFunilId)
            )
            await createInteracaoForOportunidade(oportunidade.id, {
              ...interacao,
              usuarioId: currentUser?.id,
            })
            await handleMudancaEtapaSuccess()
          }}
        />
      )}
    </>
  )
}

export default Funil
