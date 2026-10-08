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
import ModalMarcarPerdida from '../components/negocios/ModalMarcarPerdida'
import ModalMudancaEtapaFunil from '../components/negocios/ModalMudancaEtapaFunil'
import { fetchEtapasFunil } from '../services/etapasService'
import { fetchNegociosFunil, updateNegocio } from '../services/negociosService'
import { createInteracaoForNegocio } from '../services/interacoesService'
import {
  ETAPA_PERDIDA,
  buildUpdatePayload,
  findEtapaOrigem,
  resolveEtapaDestino,
} from '../utils/funilDrag'
import { getPriorityClass } from '../utils/priorityClass'

const etapasSemTempoMedio = new Set(['Fechado', 'Perdida'])

function FunilOverlayCard({ negocio }) {
  return (
    <div className="opCard opCardOverlay">

      {/* Etiqueta de Tempo na Etapa */}
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

      {/* Informações do Negócio */}
      <h3>{negocio.titulo}</h3>
      <p>{negocio.lead}</p>

      {/* Meta e Prioridade */}
      <div className="cardMeta">
        <span>{negocio.responsavel}</span>
        <span className={`priority ${getPriorityClass(negocio.prioridade)}`}>
          {negocio.prioridade}
        </span>
      </div>

      {/* Valor */}
      <strong>{negocio.valor}</strong>

    </div>
  );
}

function Funil({ onNewNegocio, onViewNegocio, onEditNegocio, currentUser }) {
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
        fetchNegociosFunil({ usuarioId: responsavelFilter || undefined }),
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

  const findNegocio = useCallback(
    (negocioId) => {
      for (const etapa of etapasAtivas) {
        const item = (funil[etapa] ?? []).find((o) => String(o.id) === String(negocioId))
        if (item) return item
      }
      return null
    },
    [funil, etapasAtivas]
  )

  const aplicarMudancaEtapa = useCallback(
    async (negocio, etapaOrigem, etapaDestino) => {
      const etapaFunilId = etapaIdPorNome[etapaDestino]
      if (!etapaFunilId) {
        setError('Etapa de destino não encontrada')
        return
      }

      setMudancaEtapaModal({
        negocio,
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
    const negocio = event.active.data.current?.negocio ?? findNegocio(event.active.id)
    setActiveCard(negocio ?? null)
  }

  const handleDragEnd = async (event) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over || mudancaEtapaModal || perdidaModal) return

    const etapaDestino = resolveEtapaDestino(over.id, funil, etapasAtivas)
    const etapaOrigem = findEtapaOrigem(active.id, funil, etapasAtivas)
    if (!etapaDestino || !etapaOrigem || etapaDestino === etapaOrigem) return

    const negocio = active.data.current?.negocio ?? findNegocio(active.id)
    if (!negocio) return

    if (etapaDestino === ETAPA_PERDIDA) {
      setPerdidaModal({ negocio, etapaOrigem })
      return
    }

    await aplicarMudancaEtapa(negocio, etapaOrigem, etapaDestino)
  }

  const handlePerdidaSuccess = async () => {
    setPerdidaModal(null)
    await loadFunil()
  }

  return (
    <>
      <Header title="Funil de Vendas" subtitle="Arraste os negócios entre as etapas" />
      <div className="toolbar">
        <FiltroResponsavel value={responsavelFilter} onChange={setResponsavelFilter} />
        <button type="button" className="primaryBtn" onClick={onNewNegocio}>
          <Plus size={18} />
          Novo Negócio
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
                    negocios={funil[etapa] ?? []}
                    isBottleneck={isBottleneck}
                    isPerdida={isPerdida}
                    diasMedios={diasMedios}
                    showTempoMedio={!etapasSemTempoMedio.has(etapa)}
                    onViewNegocio={onViewNegocio}
                    onEditNegocio={onEditNegocio}
                  />
                )
              })}
            </section>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCard ? <FunilOverlayCard negocio={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      )}
      {perdidaModal && (
        <ModalMarcarPerdida
          negocio={perdidaModal.negocio}
          currentUser={currentUser}
          onClose={() => setPerdidaModal(null)}
          onSuccess={handlePerdidaSuccess}
        />
      )}
      {mudancaEtapaModal && (
        <ModalMudancaEtapaFunil
          tituloNegocio={mudancaEtapaModal.negocio.titulo}
          etapaOrigem={mudancaEtapaModal.etapaOrigem}
          etapaDestino={mudancaEtapaModal.etapaDestino}
          onClose={() => setMudancaEtapaModal(null)}
          onConfirm={async (interacao) => {
            const { negocio, etapaFunilId } = mudancaEtapaModal
            await updateNegocio(
              negocio.id,
              buildUpdatePayload(negocio, etapaFunilId)
            )
            await createInteracaoForNegocio(negocio.id, {
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
