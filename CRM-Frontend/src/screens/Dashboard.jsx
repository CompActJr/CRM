import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Target, TrendingUp } from 'lucide-react'
import Header from '../components/layout/Header'
import Metric from '../components/common/Metric'
import { fetchDashboardAtividades, fetchDashboardStats } from '../services/dashboardService'
import { fetchMetasDashboard } from '../services/metasService'

const PeriodoOptions = [
  { value: 0.25, label: 'Última semana' },
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Últimos 12 meses' },
  { value: 'custom', label: 'Personalizado' },
]

function Dashboard({ onViewLead, onViewNegocio }) {
  const [stats, setStats] = useState(null)
  const [metasStats, setMetasStats] = useState(null)
  const [atividades, setAtividades] = useState([])
  const [atividadesMinimizadas, setAtividadesMinimizadas] = useState(false)
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

  const loadMetas = useCallback(async () => {
    try {
      const data = await fetchMetasDashboard({ meses, dataInicio, dataFim })
      setMetasStats(data)
    } catch {
      setMetasStats(null)
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
    loadMetas()
  }, [loadMetas])

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

      {/* Seção de Gráficos de Metas Comerciais */}
      <section className="gridTwo">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} style={{ color: '#0284c7' }} />
              Metas Comerciais: Status da Equipe
            </h2>
            {metasStats?.kpis && metasStats.metas.length > 0 && (
              <span className="tag ok" style={{ fontSize: '13px' }}>
                {metasStats.kpis.percentualMetasAtingidas}% atingidas
              </span>
            )}
          </div>

          {!metasStats || metasStats.metas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b' }}>
              <p>Nenhuma meta comercial ativa encontrada para este período.</p>
              <a href="#/metas" className="secondaryBtn" style={{ marginTop: '8px', display: 'inline-block', textDecoration: 'none' }}>
                Configurar Metas
              </a>
            </div>
          ) : (
            <div className="leadStatusList">
              <div className="leadStatusRow">
                <div className="leadStatusInfo">
                  <span>Metas Batidas</span>
                  <strong>{metasStats.kpis.metasAtingidas} metas</strong>
                </div>
                <div className="leadStatusBar">
                  <div
                    className="leadStatusFill"
                    style={{
                      width: `${metasStats.kpis.totalMetas > 0 ? (metasStats.kpis.metasAtingidas / metasStats.kpis.totalMetas) * 100 : 0}%`,
                      background: '#16a34a',
                    }}
                  />
                </div>
                <small>
                  {metasStats.kpis.totalMetas > 0
                    ? `${((metasStats.kpis.metasAtingidas / metasStats.kpis.totalMetas) * 100).toFixed(0)}%`
                    : '0%'}
                </small>
              </div>

              <div className="leadStatusRow">
                <div className="leadStatusInfo">
                  <span>Em Andamento</span>
                  <strong>{metasStats.kpis.metasEmAndamento} metas</strong>
                </div>
                <div className="leadStatusBar">
                  <div
                    className="leadStatusFill"
                    style={{
                      width: `${metasStats.kpis.totalMetas > 0 ? (metasStats.kpis.metasEmAndamento / metasStats.kpis.totalMetas) * 100 : 0}%`,
                      background: '#3b82f6',
                    }}
                  />
                </div>
                <small>
                  {metasStats.kpis.totalMetas > 0
                    ? `${((metasStats.kpis.metasEmAndamento / metasStats.kpis.totalMetas) * 100).toFixed(0)}%`
                    : '0%'}
                </small>
              </div>

              <div className="leadStatusRow">
                <div className="leadStatusInfo">
                  <span>Não Iniciadas</span>
                  <strong>{metasStats.kpis.metasNaoIniciadas} metas</strong>
                </div>
                <div className="leadStatusBar">
                  <div
                    className="leadStatusFill"
                    style={{
                      width: `${metasStats.kpis.totalMetas > 0 ? (metasStats.kpis.metasNaoIniciadas / metasStats.kpis.totalMetas) * 100 : 0}%`,
                      background: '#94a3b8',
                    }}
                  />
                </div>
                <small>
                  {metasStats.kpis.totalMetas > 0
                    ? `${((metasStats.kpis.metasNaoIniciadas / metasStats.kpis.totalMetas) * 100).toFixed(0)}%`
                    : '0%'}
                </small>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
                <span>Total de Metas: <strong style={{ color: '#1e293b' }}>{metasStats.kpis.totalMetas}</strong></span>
                <span>·</span>
                <span>Metas Batidas: <strong style={{ color: '#16a34a' }}>{metasStats.kpis.metasAtingidas}</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} style={{ color: '#0284c7' }} />
              Comparativo de Desempenho por Usuário
            </h2>
            <a href="#/metas" className="secondaryBtn" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '13px' }}>
              Ver todas
            </a>
          </div>

          {!metasStats || metasStats.ranking.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b' }}>
              <p>Nenhum dado de desempenho de metas disponível.</p>
            </div>
          ) : (
            <div className="leadStatusList">
              {metasStats.ranking.slice(0, 5).map((user) => (
                <div key={user.usuarioId} className="leadStatusRow" style={{ gridTemplateColumns: '160px 1fr 50px' }}>
                  <div className="leadStatusInfo">
                    <span style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      #{user.posicao} {user.nome}
                    </span>
                    <small style={{ color: '#64748b' }}>{user.cargo || 'Vendedor'}</small>
                  </div>
                  <div className="leadStatusBar">
                    <div
                      className="leadStatusFill"
                      style={{
                        width: `${Math.min(100, user.mediaProgresso)}%`,
                        background:
                          user.mediaProgresso >= 100
                            ? '#16a34a'
                            : user.mediaProgresso >= 50
                            ? '#3b82f6'
                            : '#f59e0b',
                      }}
                    />
                  </div>
                  <strong style={{ fontSize: '13px', color: user.mediaProgresso >= 100 ? '#16a34a' : '#1e293b' }}>
                    {user.mediaProgresso}%
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel dashboardActivityPanel">
        <div className="dashboardActivityHeader">
          <div>
            <h2>Atividades recentes</h2>
            <p>Alterações nos seus leads e negócios nos últimos 30 dias</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{atividades.length} atividades</span>
            <button
              type="button"
              className="iconBtn"
              onClick={() => setAtividadesMinimizadas((prev) => !prev)}
              title={atividadesMinimizadas ? 'Expandir atividades' : 'Minimizar atividades'}
              aria-label={atividadesMinimizadas ? 'Expandir atividades' : 'Minimizar atividades'}
            >
              {atividadesMinimizadas ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>
        {!atividadesMinimizadas && (
          atividades.length === 0 ? (
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
          )
        )}
      </section>
    </>
  )
}

export default Dashboard
