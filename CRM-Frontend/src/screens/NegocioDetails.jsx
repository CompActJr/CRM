



















import { useCallback, useEffect, useState } from 'react'

import { Download, FileText, XCircle } from 'lucide-react'

import PainelInteracoes from '../components/interacoes/PainelInteracoes'

import PainelPropostas from '../components/propostas/PainelPropostas'

import PainelTarefas from '../components/tarefas/PainelTarefas'

import ModalMarcarPerdida from '../components/negocios/ModalMarcarPerdida'

import Header from '../components/layout/Header'

import { fetchPropostasByNegocio, downloadPropostaPdf } from '../services/propostasService'
import { fetchNegocioById } from '../services/negociosService'

import { getPriorityClass } from '../utils/priorityClass'



function NegocioDetails({ setScreen, negocioId, initialTab = 'timeline', currentUser }) {

  const [activeTab, setActiveTab] = useState(initialTab)

  const [negocio, setNegocio] = useState(null)

  const [propostas, setPropostas] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [showPerdaModal, setShowPerdaModal] = useState(false)
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

      const [data, propostasData] = await Promise.all([
        fetchNegocioById(negocioId),
        fetchPropostasByNegocio(negocioId),
      ])

      setNegocio(data)

      setPropostas(propostasData)

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

        <button className="secondaryBtn" onClick={() => setScreen('negocio')}>

          Voltar para Negocios

        </button>

      </>

    )

  }



  return (

    <>

      <Header title="Detalhes do Negócio" subtitle="Acompanhe evolução comercial, histórico e documentos" />

      <div className="leadDetailsLayout">

        <aside className="leadSummaryCard">

          <h2>{negocio.titulo}</h2>

          <div className="leadSummaryTags">

            <span className={`priority ${getPriorityClass(negocio.prioridade)}`}>

              {negocio.prioridade}

            </span>

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

          <button className="secondaryBtn full" onClick={() => setScreen('negocio')}>

            Voltar para Negocios

          </button>

        </aside>



        <section className="leadWorkspaceCard">

          <div className="leadTabs">

            <button className={activeTab === 'timeline' ? 'leadTab active' : 'leadTab'} onClick={() => setActiveTab('timeline')}>

              Linha do tempo

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

      {showPerdaModal && (

        <ModalMarcarPerdida

          negocio={negocio}

          currentUser={currentUser}

          onClose={() => setShowPerdaModal(false)}

          onSuccess={loadNegocio}

        />

      )}

    </>

  )

}



export default NegocioDetails


