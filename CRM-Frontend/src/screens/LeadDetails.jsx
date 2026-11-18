import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Edit,
  Plus,
  RotateCcw,
  UserX,
} from 'lucide-react'
import PainelInteracoes from '../components/interacoes/PainelInteracoes'
import PainelTarefas from '../components/tarefas/PainelTarefas'
import PainelTimeline from '../components/timeline/PainelTimeline'
import ModalCriarNegocioProposta from '../components/negocios/ModalCriarNegocioProposta'
import ModalMudancaEtapaFunil from '../components/negocios/ModalMudancaEtapaFunil'
import ModalMarcarPerdida from '../components/negocios/ModalMarcarPerdida'
import Header from '../components/layout/Header'
import { fetchLeadById, mudarEtapaLead } from '../services/leadsService'
import { fetchEtapasFunil } from '../services/etapasService'
import { fetchUsuariosOpcoes } from '../services/usuariosService'

function LeadDetails({
  setScreen,
  leadId,
  initialTab = 'negocios',
  initialAction = null,
  onViewNegocio,
  onEditLead,
  currentUser,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [lead, setLead] = useState(null)
  const [showCriarNegocio, setShowCriarNegocio] = useState(initialAction === 'criarProposta')
  const [etapaPropostaId, setEtapaPropostaId] = useState(4)
  const [etapas, setEtapas] = useState([])
  const [mudancaEtapaModal, setMudancaEtapaModal] = useState(null)
  const [showPerdidaModal, setShowPerdidaModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLead = useCallback(async () => {
    if (!leadId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await fetchLeadById(leadId)
      setLead(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    loadLead()
  }, [loadLead])

  useEffect(() => {
    fetchEtapasFunil()
      .then((etapasData) => {
        const sorted = [...etapasData].sort((a, b) => a.ordem - b.ordem)
        setEtapas(sorted)
        const proposta =
          sorted.find((e) => e.ordem === 4) ||
          sorted.find((e) => e.nome === 'Proposta')
        if (proposta) setEtapaPropostaId(proposta.id)
      })
      .catch(() => {})

    fetchUsuariosOpcoes().then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    setActiveTab(initialTab)
    if (initialAction === 'criarProposta') {
      setShowCriarNegocio(true)
    }
  }, [leadId, initialTab, initialAction])

  const leadStages = useMemo(() => {
    return etapas.filter((e) => e.nome !== 'Perdida' && e.ordem <= 4)
  }, [etapas])

  const currentEtapa = useMemo(() => {
    if (!lead) return null
    return (
      etapas.find((e) => e.id === lead.etapaFunilId) || {
        id: lead.etapaFunilId,
        nome: lead.etapa || 'Mapeamento',
        ordem: lead.etapaOrdem ?? 1,
      }
    )
  }, [lead, etapas])

  const currentOrdem = currentEtapa?.ordem ?? 1

  const isLeadInativo = lead?.status === 'Inativo'

  const proximaEtapa = useMemo(() => {
    if (isLeadInativo) return null
    return etapas.find((e) => e.ordem === currentOrdem + 1 && e.nome !== 'Perdida')
  }, [etapas, currentOrdem, isLeadInativo])

  const handleAvancarPara = (targetEtapa) => {
    if (!targetEtapa || !lead) return
    if (targetEtapa.ordem >= 4) {
      setShowCriarNegocio(true)
      return
    }
    setMudancaEtapaModal({
      etapaOrigem: isLeadInativo ? 'Desqualificado' : currentEtapa?.nome || 'Etapa anterior',
      etapaDestino: targetEtapa.nome,
      etapaFunilId: targetEtapa.id,
    })
  }

  const handleReativarLead = () => {
    const primeiraEtapa = etapas.find((e) => e.ordem === 1) || etapas[0]
    if (!primeiraEtapa) return
    setMudancaEtapaModal({
      etapaOrigem: 'Desqualificado',
      etapaDestino: primeiraEtapa.nome,
      etapaFunilId: primeiraEtapa.id,
    })
  }

  const handleConfirmMudancaEtapa = async (interacao) => {
    if (!mudancaEtapaModal || !lead) return
    setActionLoading(true)
    try {
      await mudarEtapaLead(lead.id, {
        etapaFunilId: mudancaEtapaModal.etapaFunilId,
        interacao: {
          ...interacao,
          ...(currentUser?.id ? { usuarioId: Number(currentUser.id) } : {}),
        },
        ...(currentUser?.id ? { usuarioId: Number(currentUser.id) } : {}),
      })
      setMudancaEtapaModal(null)
      await loadLead()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePerdidaSuccess = async () => {
    setShowPerdidaModal(false)
    await loadLead()
  }

  const tabs = [
    { id: 'negocios', label: 'Negocios' },
    { id: 'timeline', label: 'Histórico' },
    { id: 'interacoes', label: 'Interações' },
    { id: 'tarefas', label: 'Tarefas' },
    { id: 'contact', label: 'Contato' },
    { id: 'notes', label: 'Observações' },
  ]

  if (loading) {
    return (
      <>
        <Header title="Detalhes do Lead" subtitle="Carregando informações do lead" />
        <p className="tableMessage">Carregando...</p>
      </>
    )
  }

  if (error || !lead) {
    return (
      <>
        <Header title="Detalhes do Lead" subtitle="Não foi possível carregar o lead" />
        <p className="formError">{error || 'Lead não encontrado.'}</p>
        <button type="button" className="secondaryBtn" onClick={() => setScreen('leads')}>
          Voltar para Leads
        </button>
      </>
    )
  }

  return (
    <>
      <Header title="Detalhes do Lead" subtitle="Acompanhe dados comerciais e negócios vinculados" />

      <div className="leadActionBar">
        <button
          type="button"
          className="secondaryBtn"
          onClick={() => (onEditLead ? onEditLead(lead.id) : setScreen && setScreen('leadForm'))}
          title="Editar dados deste lead"
          style={{ marginLeft: 'auto' }}
        >
          <Edit size={18} />
          Editar Lead
        </button>
      </div>

      {/* Controle de Etapas do Funil */}
      <section className="leadStagePanel">
        <div className="leadStageHeader">
          <div className="leadStageMeta">
            <span className="leadStageEyebrow">Etapa de Vendas</span>
            <div className="leadStageTitle">
              {isLeadInativo ? (
                <>
                  <span className="tag danger">Desqualificado</span>
                  {lead.motivoPerda && (
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                      Motivo: {lead.motivoPerda}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>{currentEtapa?.nome || lead.etapa}</span>
                  {currentOrdem >= 4 && (
                    <span className="tag ok">Fase de Negócio</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="leadStageActions">
            {isLeadInativo ? (
              <button
                type="button"
                className="primaryBtn"
                onClick={handleReativarLead}
                disabled={actionLoading}
              >
                <RotateCcw size={16} />
                Reativar Lead
              </button>
            ) : (
              <>
                {proximaEtapa ? (
                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={() => handleAvancarPara(proximaEtapa)}
                    disabled={actionLoading}
                  >
                    <ArrowRight size={16} />
                    {proximaEtapa.ordem >= 4
                      ? 'Avançar para Proposta (Criar Negócio)'
                      : `Avançar para ${proximaEtapa.nome}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={() => setShowCriarNegocio(true)}
                  >
                    <Plus size={16} />
                    Novo Negócio / Proposta
                  </button>
                )}

                <button
                  type="button"
                  className="secondaryBtn"
                  onClick={() => setShowPerdidaModal(true)}
                  title="Desqualificar lead no funil"
                >
                  <UserX size={16} />
                  Desqualificar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stepper visual com as etapas do funil */}
        <div className="leadStageStepper">
          {leadStages.map((stage, index) => {
            const isCompleted = !isLeadInativo && currentOrdem > stage.ordem
            const isActive = !isLeadInativo && currentOrdem === stage.ordem
            const isClickable = !actionLoading && (!isActive || isLeadInativo)

            let stepClass = 'leadStageStep'
            if (isCompleted) stepClass += ' completed'
            else if (isActive) stepClass += ' active'

            return (
              <div key={stage.id} style={{ display: 'contents' }}>
                <button
                  type="button"
                  className={stepClass}
                  onClick={() => isClickable && handleAvancarPara(stage)}
                  title={
                    stage.ordem >= 4
                      ? 'Criar proposta comercial / negócio'
                      : `Mover para ${stage.nome}`
                  }
                >
                  <span className="leadStageStepNumber">
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : stage.ordem}
                  </span>
                  <span>{stage.nome}</span>
                </button>
                {index < leadStages.length - 1 && (
                  <ChevronRight size={16} className="leadStageStepArrow" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="leadDetailsLayout">
        <aside className="leadSummaryCard">
          <h2>{lead.empresa || lead.nome}</h2>
          <div className="leadSummaryTags">
            <span className={lead.status === 'Ativo' ? 'tag ok' : 'tag danger'}>{lead.status}</span>
            {!isLeadInativo && lead.etapa && (
              <span className="tag info">{lead.etapa}</span>
            )}
          </div>
          <div className="leadSummaryList">
            <div>
              <strong>Etapa do funil</strong>
              <p>{isLeadInativo ? 'Desqualificado / Perdido' : (lead.etapa || '—')}</p>
            </div>
            <div>
              <strong>Nome do contato</strong>
              <p>{lead.nome}</p>
            </div>
            <div>
              <strong>Email</strong>
              <p>{lead.email || '—'}</p>
            </div>
            <div>
              <strong>Telefone</strong>
              <p>{lead.telefone || '—'}</p>
            </div>
            <div>
              <strong>Cidade</strong>
              <p>{lead.cidade || '—'}</p>
            </div>
            <div>
              <strong>Nicho</strong>
              <p>{lead.nicho || '—'}</p>
            </div>
            <div>
              <strong>Data de cadastro</strong>
              <p>{lead.dataCadastro}</p>
            </div>
            <div>
              <strong>Responsáveis</strong>
              {lead.responsaveis && lead.responsaveis.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {lead.responsaveis.map((resp) => (
                    <span
                      key={resp.id}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                      }}
                    >
                      {resp.nome}
                    </span>
                  ))}
                </div>
              ) : (
                <p>{lead.responsavel || '—'}</p>
              )}
            </div>
          </div>
          <div className="leadSummaryActions">
            <button
              type="button"
              className="secondaryBtn"
              onClick={() => (onEditLead ? onEditLead(lead.id) : setScreen && setScreen('leadForm'))}
            >
              <Edit size={16} />
              Editar Lead
            </button>
            <button type="button" className="secondaryBtn" onClick={() => setScreen('leads')}>
              Voltar para Leads
            </button>
          </div>
        </aside>

        <section className="leadWorkspaceCard">
          <div className="leadTabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'leadTab active' : 'leadTab'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'negocios' && (
            <div className="leadTabContent">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="primaryBtn"
                  onClick={() => setShowCriarNegocio(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  Novo Negócio
                </button>
              </div>
              {lead.negocios?.length === 0 ? (
                <p className="tableMessage">Nenhum negócio vinculado a este lead.</p>
              ) : (
                <div className="tableCard">
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Etapa</th>
                        <th>Valor</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.negocios.map((negocio) => (
                        <tr key={negocio.id}>
                          <td>{negocio.titulo}</td>
                          <td>{negocio.etapa}</td>
                          <td>{negocio.valor}</td>
                          <td>
                            <button
                              type="button"
                              className="secondaryBtn"
                              onClick={() => onViewNegocio(negocio.id)}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && <PainelTimeline leadId={lead.id} />}

          {activeTab === 'interacoes' && (
            <PainelInteracoes
              leadId={lead.id}
              negocios={lead.negocios ?? []}
              currentUser={currentUser}
              initialOpenForm={initialAction === 'criarInteracao'}
            />
          )}

          {activeTab === 'tarefas' && (
            <PainelTarefas
              leadId={lead.id}
              currentUser={currentUser}
              initialOpenForm={initialAction === 'criarTarefa'}
            />
          )}

          {activeTab === 'contact' && (
            <div className="leadTabContent">
              <div className="tableCard">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{lead.nome}</td>
                      <td>{lead.email || '—'}</td>
                      <td>{lead.telefone || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="leadTabContent">
              <label className="inputGroup fullLine">
                <span>Observações</span>
                <textarea readOnly value={lead.observacoes || 'Sem observações registradas.'} />
              </label>
            </div>
          )}
        </section>
      </div>

      {mudancaEtapaModal && (
        <ModalMudancaEtapaFunil
          tituloNegocio={lead.empresa || lead.nome}
          etapaOrigem={mudancaEtapaModal.etapaOrigem}
          etapaDestino={mudancaEtapaModal.etapaDestino}
          isLead={true}
          onClose={() => setMudancaEtapaModal(null)}
          onConfirm={handleConfirmMudancaEtapa}
        />
      )}

      {showPerdidaModal && (
        <ModalMarcarPerdida
          negocio={{
            leadId: lead.id,
            tipoCard: 'lead',
            titulo: lead.empresa || lead.nome,
          }}
          currentUser={currentUser}
          onClose={() => setShowPerdidaModal(false)}
          onSuccess={handlePerdidaSuccess}
        />
      )}

      {showCriarNegocio && (
        <ModalCriarNegocioProposta
          lead={{
            leadId: lead.id,
            lead: lead.nome,
            empresa: lead.empresa,
            usuarioId: lead.usuarioId,
          }}
          etapaDestino="Proposta"
          etapaFunilId={etapaPropostaId}
          users={users}
          currentUser={currentUser}
          onClose={() => setShowCriarNegocio(false)}
          onSuccess={async () => {
            setShowCriarNegocio(false)
            await loadLead()
          }}
        />
      )}
    </>
  )
}

export default LeadDetails
