import { useCallback, useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Metric from '../components/common/Metric'
import { fetchDashboardAtividades, fetchDashboardStats } from '../services/dashboardService'

const PeriodoOptions = [
  { value: 0.25, label: 'Última semana' },
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Últimos 12 meses' },
  { value: 'custom', label: 'Personalizado' },
]

function Dashboard({ onViewLead, onViewNegocio }) {
  const [stats, setStats] = useState(null)
  const [atividades, setAtividades] = useState([])
  const [meses, setMeses] = useState(6)

  // Inicializamos as datas padrão direto no useState para evitar o loop infinito
  const [dataInicio, setDataInicio] = useState(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [dataFim, setDataFim] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchDashboardStats({ meses, dataInicio, dataFim })
      setStats(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [meses, dataInicio, dataFim])

  const loadAtividades = useCallback(async () => {
    try {
      setAtividades(await fetchDashboardAtividades())
    } catch {
      setAtividades([])
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadAtividades()
  }, [loadAtividades])

  const renderChartTitle = () => {
    if (!stats) return ''
    if (stats.meses === 0.25) return 'Leads por dia (última semana)'
    if (stats.meses === 'custom') return 'Leads por período personalizado'
    return `Leads por mês (últimos ${stats.meses ?? meses} meses)`
  }

  if (loading && !stats) {
    return (
      <>
        <Header title="Dashboard" subtitle="Resumo geral do desempenho comercial" />
        <p className="tableMessage">Carregando indicadores...</p>
      </>
    )
  }

  if (error || !stats) {
    return (
      <>
        <Header title="Dashboard" subtitle="Resumo geral do desempenho comercial" />
        <p className="formError">{error || 'Não foi possível carregar o dashboard.'}</p>
      </>
    )
  }

  return (
    <>
      <Header title="Dashboard" subtitle="Resumo geral do desempenho comercial" />
      <section className="filtersPanel">
        <label>
          <span>Período</span>
          <select
            value={meses}
            onChange={(event) => {
              const val = event.target.value === 'custom' ? 'custom' : Number(event.target.value)
              setMeses(val)
            }}
          >
            {PeriodoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {meses === 'custom' && (
          <>
            <label>
              <span>Data Início</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
              />
            </label>
            <label>
              <span>Data Fim</span>
              <input
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
              />
            </label>
          </>
        )}
      </section>
      <section className="cardsGrid">
        <Metric title="Total de Leads" value={String(stats.totalLeads)} change={`${stats.leadsAtivos} ativos`} />
        <Metric
          title="Negócios em Aberto"
          value={String(stats.negociosAbertas)}
          change={`${stats.emNegociacao} em negociação`}
        />
        <Metric title="Taxa de Conversão" value={`${stats.taxaConversao}%`} change="Negócios fechados" />
        <Metric
          title="Valor total de negócios em andamento"
          value={stats.negociosEmAndamento?.valor ?? 'R$ 0,00'}
          change={`${stats.negociosEmAndamento?.quantidade ?? 0} negócios em andamento`}
        />
      </section>
      <section className="gridTwo">
        <div className="panel">
          <h2>{renderChartTitle()}</h2>
          <div className="barChart">
            {stats.leadsPorMes.map((item) => (
              <div key={`${item.label}-${item.count}`} className="barGroup">
                <span className={`barCount ${item.count === 0 ? 'barCountEmpty' : ''}`}>
                  {item.count}
                </span>
                <div className="barTrack">
                  {item.count > 0 && (
                    <div className="bar" style={{ height: `${item.height}%` }} />
                  )}
                </div>
                <span className="barLabel">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Separação de leads: Ativo x Inativo</h2>
          <div className="leadStatusList">
            <div className="leadStatusRow">
              <div className="leadStatusInfo">
                <span>Ativos</span>
                <strong>{stats.leadsAtivos} leads</strong>
              </div>
              <div className="leadStatusBar">
                <div className="leadStatusFill active" style={{ width: `${stats.ativosPercentual}%` }} />
              </div>
              <small>{stats.ativosPercentual}%</small>
            </div>
            <div className="leadStatusRow">
              <div className="leadStatusInfo">
                <span>Inativos</span>
                <strong>{stats.leadsInativos} leads</strong>
              </div>
              <div className="leadStatusBar">
                <div className="leadStatusFill passive" style={{ width: `${stats.passivosPercentual}%` }} />
              </div>
              <small>{stats.passivosPercentual}%</small>
            </div>
          </div>
        </div>
      </section>
      <section className="panel dashboardActivityPanel">
        <div className="dashboardActivityHeader">
          <div>
            <h2>Atividades recentes</h2>
            <p>Alterações nos seus leads e negócios nos últimos 30 dias</p>
          </div>
          <span>{atividades.length} atividades</span>
        </div>
        {atividades.length === 0 ? (
          <p className="tableMessage">Nenhuma atividade recente nos seus leads e negócios.</p>
        ) : (
          <ul className="dashboardActivityList">
            {atividades.map((atividade) => (
              <li key={atividade.id}>
                <span className={`dashboardActivityDot dashboardActivityDot-${atividade.tipo}`} />
                <div className="dashboardActivityContent">
                  <strong>{atividade.evento}</strong>
                  <span>{atividade.leadNome}{atividade.negocioTitulo ? ` · ${atividade.negocioTitulo}` : ''}</span>
                  {atividade.descricao && atividade.descricao !== atividade.negocioTitulo && <p>{atividade.descricao}</p>}
                  {atividade.detalhe && <small>{atividade.detalhe}</small>}
                </div>
                <time dateTime={atividade.data}>
                  {new Date(atividade.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
                <a
                  className="dashboardActivityLink"
                  href={atividade.negocioId
                    ? `#/negocios/${atividade.negocioId}/timeline`
                    : `#/leads/${atividade.leadId}/timeline`}
                  onClick={(event) => {
                    event.preventDefault()
                    if (atividade.negocioId && onViewNegocio) {
                      onViewNegocio(atividade.negocioId, 'timeline')
                    } else if (atividade.leadId && onViewLead) {
                      onViewLead(atividade.leadId, 'timeline')
                    } else {
                      window.location.hash = event.currentTarget.getAttribute('href')
                    }
                  }}
                >Abrir</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default Dashboard
