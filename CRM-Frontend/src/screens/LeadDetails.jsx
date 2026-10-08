import { useEffect, useState } from 'react'
import PainelInteracoes from '../components/interacoes/PainelInteracoes'
import PainelTarefas from '../components/tarefas/PainelTarefas'
import Header from '../components/layout/Header'
import { fetchLeadById } from '../services/leadsService'
import { getPriorityClass } from '../utils/priorityClass'

function LeadDetails({ setScreen, leadId, initialTab = 'negocios', onViewNegocio, onEditLead, currentUser }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLead = async () => {
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
    }
    loadLead()
  }, [leadId])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [leadId, initialTab])

  const tabs = [
    { id: 'negocios', label: 'Negocios' },
    { id: 'timeline', label: 'Linha do tempo' },
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
      <div className="leadDetailsLayout">
        <aside className="leadSummaryCard">
          <h2>{lead.empresa || lead.nome}</h2>
          <span className={lead.status === 'Ativo' ? 'tag ok' : 'tag danger'}>{lead.status}</span>
          <div className="leadSummaryList">
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
              <strong>Responsável</strong>
              <p>{lead.responsavel}</p>
            </div>
          </div>
          <div className="leadSummaryActions">
            <button type="button" className="secondaryBtn" onClick={() => onEditLead(lead.id)}>
              Editar lead
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
              {lead.negocios?.length === 0 ? (
                <p className="tableMessage">Nenhum negócio vinculado a este lead.</p>
              ) : (
                <div className="tableCard">
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Etapa</th>
                        <th>Prioridade</th>
                        <th>Valor</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.negocios.map((negocio) => (
                        <tr key={negocio.id}>
                          <td>{negocio.titulo}</td>
                          <td>{negocio.etapa}</td>
                          <td>
                            <span className={`priority ${getPriorityClass(negocio.prioridade)}`}>
                              {negocio.prioridade}
                            </span>
                          </td>
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

          {activeTab === 'timeline' && (
            <PainelInteracoes
              leadId={lead.id}
              negocios={lead.negocios ?? []}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'tarefas' && (
            <PainelTarefas leadId={lead.id} currentUser={currentUser} />
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
    </>
  )
}

export default LeadDetails
