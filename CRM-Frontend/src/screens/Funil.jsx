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
import { ArrowUp, ArrowDown, Maximize2, Minimize2, Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import FiltroResponsavel from '../components/filtros/FiltroResponsavel'
import FunilColuna from '../components/funil/FunilColuna'
import ModalMudancaEtapaFunil from '../components/negocios/ModalMudancaEtapaFunil'
import ModalCriarNegocioProposta from '../components/negocios/ModalCriarNegocioProposta'
import ModalGanharLead from '../components/negocios/ModalGanharLead'
import { fetchEtapasFunil } from '../services/etapasService'
import { fetchNegociosFunil, updateNegocio } from '../services/negociosService'
import { mudarEtapaLead } from '../services/leadsService'
import { createInteracaoForNegocio } from '../services/interacoesService'
import {
  buildUpdatePayload,
  findEtapaOrigem,
  resolveEtapaDestino,
  getFunilCardDisplayTitle,
  getTemperaturaInfo,
  hasValidValorEstimado,
  isEtapaPerdida,
  isEtapaProposta,
  isEtapaVendida,
  isTituloGenerico,
} from '../utils/funilDrag'
import SearchableSelect from "../components/common/SearchableSelect";
import {fetchUsuariosOpcoes} from "../services/usuariosService";

const etapasSemTempoMedio = new Set(['Fechado', 'Pós Venda', 'Pos Venda', 'Pós-Venda', 'Ganho', 'Vendido'])

function FunilOverlayCard({ negocio, isMinimized = false }) {
  const isLead = negocio?.tipoCard === 'lead'
  const isVendido = isEtapaVendida(negocio?.etapa)
  const temperatura = getTemperaturaInfo(negocio?.diasNaEtapa)
  const displayTitle = getFunilCardDisplayTitle(negocio)

  if (isMinimized) {
    return (
      <div className="opCard opCardOverlay opCardMinimized">
        <div className="opCardMiniRow">
          <div className="opCardMiniContent">
            {!isVendido && negocio?.diasNaEtapa !== undefined && (
              <span className={`opCardTempDot ${temperatura.key}`} />
            )}
            <div className="opCardMiniText">
              <strong className="opCardMiniTitle">{displayTitle}</strong>
              {(negocio?.valor || isLead) && (
                <span className="opCardMiniMeta">{isLead ? 'Lead' : negocio.valor}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="opCard opCardOverlay">
      {/* Etiqueta de Tempo na Etapa */}
      {!isVendido && negocio?.diasNaEtapa !== undefined && (
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

      {/* Informações do Negócio ou Lead */}
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

      {/* Meta */}
      <div className="cardMeta">
        <span>{negocio.responsavel}</span>
      </div>

      {/* Valor */}
      {negocio.valor && <strong>{negocio.valor}</strong>}
    </div>
  );
}

function Funil({
  onNewNegocio,
  onViewNegocio,
  onEditNegocio,
  onViewLead,
  onEditLead,
  currentUser,
}) {
  const [funil, setFunil] = useState({})
  const [tempoMedioPorEtapa, setTempoMedioPorEtapa] = useState({})
  const [etapas, setEtapas] = useState([])
  const [filters, setFilters] = useState({
    nome: '',
    cnpj: '',
    empresa: '',
    temperatura: '',
    usuarioId: ''
  })
  const [responsavelFilter, setResponsavelFilter] = useState({})
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [isCardsMinimized, setIsCardsMinimized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCard, setActiveCard] = useState(null)
  const [mudancaEtapaModal, setMudancaEtapaModal] = useState(null)
  const [criarNegocioModal, setCriarNegocioModal] = useState(null)
  const [ganharModal, setGanharModal] = useState(null)
  const [users, setUsers] = useState([])

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
      setEtapas(etapasData.filter((etapa) => !isEtapaPerdida(etapa.nome)))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [responsavelFilter])

  useEffect(() => {
    loadFunil()
    fetchUsuariosOpcoes().then(setUsers).catch(() => {})
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

  const etapaOrdemPorNome = useMemo(() => {
    const map = {}
    for (const etapa of etapas) {
      map[etapa.nome] = etapa.ordem
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

  const podeMudarEtapa = (card, etapaOrigem, etapaDestino) => {
    const ordemOrigem = etapaOrdemPorNome[etapaOrigem]
    const ordemDestino = etapaOrdemPorNome[etapaDestino]
    if (!etapaDestino || !etapaOrigem) return false
    if (etapaDestino === etapaOrigem) return false
    // Negócios só podem existir a partir da fase de Proposta (ordem >= 4)
    if (card?.tipoCard === 'negocio' && ordemDestino < 4) {
      return false
    }

    // Conversão antecipada: de Proposta (4) direto para Pós Venda / Fechado (6)
    if (
      card?.tipoCard === 'negocio' &&
      isEtapaProposta(etapaOrigem, ordemOrigem) &&
      (isEtapaVendida(etapaDestino) || ordemDestino === 6)
    ) {
      return true
    }

    if (ordemDestino === ordemOrigem + 1) return true
    return false
  }

  const handleDragEnd = async (event) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over || mudancaEtapaModal || criarNegocioModal || ganharModal) return

    const etapaDestino = resolveEtapaDestino(over.id, funil, etapasAtivas)
    const etapaOrigem = findEtapaOrigem(active.id, funil, etapasAtivas)
    const card = active.data.current?.negocio ?? findNegocio(active.id)
    if (!card) return

    const ordemOrigem = etapaOrdemPorNome[etapaOrigem]
    const ordemDestino = etapaOrdemPorNome[etapaDestino]

    if (!podeMudarEtapa(card, etapaOrigem, etapaDestino)) {
      if (card.tipoCard === 'negocio' && ordemDestino < 4) {
        setError('Negócios só podem existir a partir da fase de Proposta.')
      } else if (ordemDestino !== undefined && ordemOrigem !== undefined && ordemDestino < ordemOrigem) {
        setError('Não é possível retroceder etapas arrastando. Para voltar de etapa, utilize a edição.')
      }
      return
    }

    setError('')

    // Se o card for um LEAD:
    if (card.tipoCard === 'lead') {
      // Se for arrastado para Proposta (ou além):
      if (ordemDestino >= 4) {
        setCriarNegocioModal({
          lead: card,
          etapaDestino,
          etapaFunilId: etapaIdPorNome[etapaDestino],
        })
        return
      }

      // Mudança normal entre etapas preliminares (< 4): abre o modal de anotações
      await aplicarMudancaEtapa(card, etapaOrigem, etapaDestino)
      return
    }

    // Se o card for um NEGÓCIO:
    if (
      isEtapaProposta(etapaOrigem, ordemOrigem) &&
      (isEtapaVendida(etapaDestino) || ordemDestino === 6)
    ) {
      setGanharModal({
        negocio: card,
        etapaDestino,
        etapaFunilId: etapaIdPorNome[etapaDestino],
      })
      return
    }

    if (!hasValidValorEstimado(card.valorEstimado)) {
      setError(
        'Preencha o valor estimado do negócio antes de avançar de etapa.'
      )
      return
    }

    await aplicarMudancaEtapa(card, etapaOrigem, etapaDestino)
  }

  const applyFilters = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await fetchNegociosFunil({
        ...filters,
        usuarioId: filters.usuarioId || undefined,
      })

      setFunil(data.funil ?? data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Funil de Vendas" subtitle="Arraste os negócios entre as etapas" />
      <div className="toolbar">
        <button onClick={() => setIsAdvancedFiltersOpen((value) => !value)} className="secondaryBtn">
          {!isAdvancedFiltersOpen ? <ArrowDown size={18} /> : <ArrowUp size={18} /> }
          Filtros avançados
        </button>
        <button
          type="button"
          onClick={() => setIsCardsMinimized((value) => !value)}
          className="secondaryBtn"
          aria-pressed={isCardsMinimized}
        >
          {isCardsMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          {isCardsMinimized ? 'Expandir cards' : 'Minimizar cards'}
        </button>
        <button type="button" className="primaryBtn" onClick={onNewNegocio}>
          <Plus size={18} />
          Novo Negócio
        </button>
      </div>
      {isAdvancedFiltersOpen && (
      <section className="filtersPanel">
        <div className="formGrid">
          <label className="inputGroup">
            <span>Nome</span>
            <input
                value={filters.nome}
                onChange={(event) =>
                    setFilters({
                      ...filters,
                      nome: event.target.value,
                    })
                }
            />
          </label>
          <label className="inputGroup">
            <span>CNPJ</span>
            <input
                value={filters.cnpj}
                onChange={(event) =>
                    setFilters({
                      ...filters,
                      cnpj: event.target.value,
                    })
                }
            />
          </label>
          <label className="inputGroup">
            <span>Empresa</span>
            <input
                value={filters.empresa}
                onChange={(event) =>
                    setFilters({
                      ...filters,
                      empresa: event.target.value,
                    })
                }
            />
          </label>
          <label className="inputGroup">
            <span>Temperatura</span>
            <SearchableSelect
                options={[
                  { value: 'Quente', label: 'Quente' },
                  { value: 'Morno', label: 'Morno' },
                  { value: 'Frio', label: 'Frio' },
                ]}
                value={filters.temperatura}
                onChange={(value) =>
                    setFilters({
                      ...filters,
                      temperatura: value,
                    })
                }
                placeholder="Selecione a temperatura"
            />
          </label>
          <label className="inputGroup">
            <span>Responsável</span>

            <SearchableSelect
                options={users.map((user) => ({ value: user.id.toString(), label: user.nome }))}
                value={filters.usuarioId}
                onChange={(value) =>
                    setFilters({
                      ...filters,
                      usuarioId: value,
                    })
                }
                placeholder="Selecione o responsável"
            />

          </label>
          <button onClick={applyFilters} className="primaryBtn fullLine">
            Filtrar
          </button>
        </div>
      </section>
      )}
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
                    diasMedios={diasMedios}
                    showTempoMedio={!etapasSemTempoMedio.has(etapa)}
                    isMinimized={isCardsMinimized}
                    onViewNegocio={onViewNegocio}
                    onEditNegocio={onEditNegocio}
                    onViewLead={onViewLead}
                    onEditLead={onEditLead}
                  />
                )
              })}
            </section>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCard ? <FunilOverlayCard negocio={activeCard} isMinimized={isCardsMinimized} /> : null}
          </DragOverlay>
        </DndContext>
      )}
      {criarNegocioModal && (
        <ModalCriarNegocioProposta
          lead={criarNegocioModal.lead}
          etapaDestino={criarNegocioModal.etapaDestino}
          etapaFunilId={criarNegocioModal.etapaFunilId}
          users={users}
          currentUser={currentUser}
          onClose={() => setCriarNegocioModal(null)}
          onSuccess={async () => {
            setCriarNegocioModal(null)
            await loadFunil({ silent: true })
          }}
        />
      )}
      {ganharModal && (
        <ModalGanharLead
          negocio={ganharModal.negocio}
          etapaDestinoNome={ganharModal.etapaDestino}
          etapaFunilId={ganharModal.etapaFunilId}
          currentUser={currentUser}
          onClose={() => setGanharModal(null)}
          onSuccess={async () => {
            setGanharModal(null)
            await loadFunil({ silent: true })
          }}
        />
      )}
      {mudancaEtapaModal && (
        <ModalMudancaEtapaFunil
          tituloNegocio={mudancaEtapaModal.negocio.titulo}
          etapaOrigem={mudancaEtapaModal.etapaOrigem}
          etapaDestino={mudancaEtapaModal.etapaDestino}
          isLead={mudancaEtapaModal.negocio.tipoCard === 'lead'}
          onClose={() => setMudancaEtapaModal(null)}
          onConfirm={async (interacao) => {
            const { negocio, etapaFunilId } = mudancaEtapaModal
            if (negocio.tipoCard === 'lead') {
              await mudarEtapaLead(negocio.leadId, {
                etapaFunilId,
                interacao,
              })
            } else {
              await updateNegocio(
                negocio.id,
                buildUpdatePayload(negocio, etapaFunilId)
              )
              await createInteracaoForNegocio(negocio.id, {
                ...interacao,
                usuarioId: currentUser?.id,
              })
            }
            await handleMudancaEtapaSuccess()
          }}
        />
      )}
    </>
  )
}

export default Funil
