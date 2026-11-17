import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import PainelInteracoes from '../components/interacoes/PainelInteracoes'
import PainelPropostas from '../components/propostas/PainelPropostas'
import PainelTarefas from '../components/tarefas/PainelTarefas'
import PainelTimeline from '../components/timeline/PainelTimeline'
import ModalMarcarPerdida from '../components/negocios/ModalMarcarPerdida'
import ModalMudancaEtapaFunil from '../components/negocios/ModalMudancaEtapaFunil'
import Header from '../components/layout/Header'
import { fetchPropostasByNegocio, downloadPropostaPdf } from '../services/propostasService'
import { fetchNegocioById, updateNegocio } from '../services/negociosService'
import { fetchEtapasFunil } from '../services/etapasService'
import { createInteracaoForNegocio } from '../services/interacoesService'
import { buildUpdatePayload } from '../utils/funilDrag'


function NegocioDetails({ setScreen, negocioId, initialTab = 'timeline', currentUser }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [negocio, setNegocio] = useState(null)
  const [etapas, setEtapas] = useState([])
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showPerdaModal, setShowPerdaModal] = useState(false)
  const [mudancaEtapaModal, setMudancaEtapaModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [documentError, setDocumentError] = useState('')

  const loadNegocio = useCallback(async () => {
    if (!negocioId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    try {
      const [data, propostasData, etapasData] = await Promise.all([
        fetchNegocioById(negocioId),
        fetchPropostasByNegocio(negocioId),
        fetchEtapasFunil(),
      ])
      setNegocio(data)
      setPropostas(propostasData)
      setEtapas(Array.isArray(etapasData) ? etapasData : [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    loadNegocio()
  }, [loadNegocio])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [negocioId, initialTab])

  const propostaRecente = propostas[0] ?? null

  const dealStages = useMemo(() => {
    return etapas
      .filter((e) => e.ordem >= 4 && e.nome !== 'Perdida')
      .sort((a, b) => a.ordem - b.ordem)
  }, [etapas])

  const currentEtapa = useMemo(() => {
    if (!negocio) return null
    return (
      etapas.find((e) => e.id === negocio.etapaFunilId) || {
        id: negocio.etapaFunilId,
        nome: negocio.etapa || 'Proposta',
        ordem: 4,
      }
    )
  }, [negocio, etapas])

  const currentOrdem = currentEtapa?.ordem ?? 4
  const isNegocioPerdido = Boolean(negocio?.perdida || negocio?.motivoPerdaId)

  const proximaEtapa = useMemo(() => {
    if (isNegocioPerdido) return null
    return etapas.find((e) => e.ordem === currentOrdem + 1 && e.nome !== 'Perdida')
  }, [etapas, currentOrdem, isNegocioPerdido])

  const handleAvancarPara = (targetEtapa) => {
    if (!targetEtapa || !negocio) return
    setMudancaEtapaModal({
      etapaOrigem: isNegocioPerdido ? 'Perdida' : currentEtapa?.nome || 'Etapa anterior',
      etapaDestino: targetEtapa.nome,
      etapaFunilId: targetEtapa.id,
    })
  }

  const handleReativarNegocio = () => {
    const primeiraEtapa = dealStages[0]
    if (!primeiraEtapa) return
    setMudancaEtapaModal({
      etapaOrigem: 'Perdida',
      etapaDestino: primeiraEtapa.nome,
      etapaFunilId: primeiraEtapa.id,
    })
  }

  const handleConfirmMudancaEtapa = async (interacao) => {
    if (!mudancaEtapaModal || !negocio) return
    setActionLoading(true)
    try {
      await updateNegocio(
        negocio.id,
        buildUpdatePayload(negocio, mudancaEtapaModal.etapaFunilId)
      )
      const resolvedUserId =
        currentUser?.id ??
        negocio.usuarioId ??
        (negocio.responsaveis && negocio.responsaveis[0]?.id)
      await createInteracaoForNegocio(negocio.id, {
        ...interacao,
        ...(resolvedUserId ? { usuarioId: Number(resolvedUserId) } : {}),
      })
      setMudancaEtapaModal(null)
      await loadNegocio()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePerdidaSuccess = async () => {
    setShowPerdaModal(false)
    await loadNegocio()
  }

  const handleDownloadPdf = async () => {
    if (!propostaRecente) return
    setDownloadingPdf(true)
    setDocumentError('')
    try {
      await downloadPropostaPdf(propostaRecente.id)
    } catch (requestError) {
      setDocumentError(requestError.message)
    } finally {
      setDownloadingPdf(false)
    }
  }



  if (loading) {

    return (

      <>

        <Header title="Detalhes do Negócio" subtitle="Carregando dados do negócio" />

        <p className="tableMessage">Carregando...</p>

      </>

    )

  }



  if (error || !negocio) {
    return (
      <>
        <Header title="Detalhes do Negócio" subtitle="Não foi possível carregar o negócio" />
        <p className="formError">{error || 'Negócio não encontrado.'}</p>

        <button className="secondaryBtn" onClick={() => setScreen('negocios')}>
          Voltar para Negocios
        </button>
      </>
    )
  }

  return (
    <>
      <Header title="Detalhes do Negócio" subtitle="Acompanhe evolução comercial, histórico e documentos" />

      {/* Controle de Etapas do Funil */}
      <section className="leadStagePanel">
        <div className="leadStageHeader">
          <div className="leadStageMeta">
            <span className="leadStageEyebrow">Etapa do Negócio</span>
            <div className="leadStageTitle">
              {isNegocioPerdido ? (
                <>
                  <span className="tag danger">Perdido</span>
                  {negocio.motivoPerda && (
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                      Motivo: {negocio.motivoPerda}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>{currentEtapa?.nome || negocio.etapa}</span>
                  {!proximaEtapa && (
                    <span className="tag ok">Ganho / Fechado</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="leadStageActions">
            {isNegocioPerdido ? (
              <button
                type="button"
                className="primaryBtn"
                onClick={handleReativarNegocio}
                disabled={actionLoading}
              >
                <RotateCcw size={16} />
                Reativar Negócio
              </button>
            ) : (
              <>
                {proximaEtapa && (
                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={() => handleAvancarPara(proximaEtapa)}
                    disabled={actionLoading}
                  >
                    <ArrowRight size={16} />
                    Avançar para {proximaEtapa.nome}
                  </button>
                )}

                <button
                  type="button"
                  className="secondaryBtn"
                  onClick={() => setShowPerdaModal(true)}
                  title="Marcar negócio como perdido"
                >
                  <XCircle size={16} />
                  Marcar como perdida
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stepper visual com as etapas do funil */}
        <div className="leadStageStepper">
          {dealStages.map((stage, index) => {
            const isCompleted = !isNegocioPerdido && currentOrdem > stage.ordem
            const isActive = !isNegocioPerdido && currentOrdem === stage.ordem
            const isClickable = !actionLoading && (!isActive || isNegocioPerdido)

            let stepClass = 'leadStageStep'
            if (isCompleted) stepClass += ' completed'
            else if (isActive) stepClass += ' active'

            return (
              <div key={stage.id} style={{ display: 'contents' }}>
                <button
                  type="button"
                  className={stepClass}
                  onClick={() => isClickable && handleAvancarPara(stage)}
                  disabled={!isClickable}
                  title={`Mover para ${stage.nome}`}
                >
                  <span className="leadStageStepNumber">
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span>{stage.nome}</span>
                </button>
                {index < dealStages.length - 1 && (
                  <div className={`leadStageStepArrow ${isCompleted ? 'completed' : ''}`}>
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="leadDetailsLayout">
        <aside className="leadSummaryCard">
          <h2>{negocio.titulo}</h2>

          <div className="leadSummaryTags">
            {negocio.perdida && <span className="tag danger">Perdido</span>}
          </div>

          <div className="leadSummaryList">

            <div>

              <strong>Lead</strong>

              <p>{negocio.lead}</p>

            </div>

            <div>
              <strong>Responsáveis</strong>
              {negocio.responsaveis && negocio.responsaveis.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {negocio.responsaveis.map((resp) => (
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
                <p>{negocio.responsavel || '-'}</p>
              )}
            </div>

            <div>

              <strong>Etapa</strong>

              <p>{negocio.etapa}</p>

            </div>

            <div>

              <strong>Valor</strong>

              <p>{negocio.valor}</p>

            </div>

            <div>

              <strong>Data de criação</strong>

              <p>{negocio.dataCriacao}</p>

            </div>

            {negocio.motivoPerda && (

              <div>

                <strong>Motivo da perda</strong>

                <p>{negocio.motivoPerda}</p>

              </div>

            )}

          </div>

          {!negocio.perdida && (

            <button type="button" className="dangerBtn full" onClick={() => setShowPerdaModal(true)}>

              <XCircle size={18} />

              Marcar como perdida

            </button>

          )}

          <button className="secondaryBtn full" onClick={() => setScreen('negocios')}>
            Voltar para Negocios
          </button>

        </aside>



        <section className="leadWorkspaceCard">

          <div className="leadTabs">

            <button className={activeTab === 'timeline' ? 'leadTab active' : 'leadTab'} onClick={() => setActiveTab('timeline')}>

              Histórico

            </button>

            <button className={activeTab === 'interacoes' ? 'leadTab active' : 'leadTab'} onClick={() => setActiveTab('interacoes')}>

              Interações

            </button>

            <button className={activeTab === 'tarefas' ? 'leadTab active' : 'leadTab'} onClick={() => setActiveTab('tarefas')}>

              Tarefas

            </button>

            <button className={activeTab === 'proposals' ? 'leadTab active' : 'leadTab'} onClick={() => setActiveTab('proposals')}>

              Propostas

            </button>

            <button className={activeTab === 'documents' ? 'leadTab active' : 'leadTab'} onClick={() => setActiveTab('documents')}>

              Documentos

            </button>

          </div>



          {activeTab === 'timeline' && (

            <PainelTimeline negocioId={negocio.id} />

          )}



          {activeTab === 'interacoes' && (

            <PainelInteracoes

              leadId={negocio.leadId}

              negocioId={negocio.id}

              currentUser={currentUser}

            />

          )}



          {activeTab === 'tarefas' && (

            <PainelTarefas

              leadId={negocio.leadId}

              negocioId={negocio.id}

              currentUser={currentUser}

            />

          )}



          {activeTab === 'proposals' && (

            <PainelPropostas

              negocioId={negocio.id}

              currentUser={currentUser}

              onPropostasChange={setPropostas}

            />

          )}



          {activeTab === 'documents' && (

            <div className="leadTabContent">

              {propostaRecente ? (

                <div className="documentPreview">

                  <div className="documentPreviewHeader">

                    <div>

                      <FileText size={20} />

                      <strong>{propostaRecente.titulo}</strong>

                    </div>

                    <button
                      type="button"
                      className="secondaryBtn"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                    >
                      <Download size={18} />
                      {downloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
                    </button>
                  </div>
                  {documentError && <p className="formError">{documentError}</p>}

                  <div className="documentPreviewBody">

                    <h3>Resumo da proposta mais recente</h3>

                    <p>

                      Proposta vinculada ao negócio <strong>{negocio.titulo}</strong>.

                    </p>

                    <ul>

                      <li>Valor: {propostaRecente.valor}</li>

                      <li>Status: {propostaRecente.status}</li>

                      <li>Data: {propostaRecente.dataProposta}</li>

                      <li>Responsável: {propostaRecente.responsavel ?? negocio.responsavel}</li>

                      <li>Etapa do negócio: {negocio.etapa}</li>

                    </ul>

                  </div>

                </div>

              ) : (

                <p className="tableMessage">

                  Cadastre uma proposta na aba Propostas para visualizar o resumo aqui.

                </p>

              )}

            </div>

          )}

        </section>

      </div>

      {mudancaEtapaModal && (
        <ModalMudancaEtapaFunil
          tituloNegocio={negocio.titulo}
          etapaOrigem={mudancaEtapaModal.etapaOrigem}
          etapaDestino={mudancaEtapaModal.etapaDestino}
          isLead={false}
          onClose={() => setMudancaEtapaModal(null)}
          onConfirm={handleConfirmMudancaEtapa}
        />
      )}

      {showPerdaModal && (
        <ModalMarcarPerdida
          negocio={negocio}
          currentUser={currentUser}
          onClose={() => setShowPerdaModal(false)}
          onSuccess={handlePerdidaSuccess}
        />
      )}

    </>

  )

}



export default NegocioDetails


