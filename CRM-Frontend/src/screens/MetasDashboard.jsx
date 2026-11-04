import { useCallback, useEffect, useState } from 'react'
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  ListFilter,
  Medal,
  Target,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react'
import Header from '../components/layout/Header'
import Metric from '../components/common/Metric'
import { fetchMetasContribuicoes, fetchMetasDashboard } from '../services/metasService'
import { fetchUsuariosOpcoes } from '../services/usuariosService'
import { formatValorFromAmount } from '../utils/currencyInput'

const PeriodoOptions = [
  { value: 0.25, label: 'Última semana' },
  { value: 1, label: 'Mês atual' },
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Últimos 12 meses' },
  { value: 'custom', label: 'Personalizado' },
]

function MetasDashboard({ onViewLead, onViewNegocio, onEditUsuario, setScreen }) {
  const [stats, setStats] = useState(null)
  const [usuariosOpcoes, setUsuariosOpcoes] = useState([])
  const [meses, setMeses] = useState(3)
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 2)
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dataFim, setDataFim] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [usuarioId, setUsuarioId] = useState('')
  const [tipoMeta, setTipoMeta] = useState('todos')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal de Histórico de Contribuições
  const [modalContribuicoes, setModalContribuicoes] = useState(null)
  const [loadingContribuicoes, setLoadingContribuicoes] = useState(false)
  const [contribuicoesData, setContribuicoesData] = useState(null)
  const [contribuicoesError, setContribuicoesError] = useState('')

  const loadUsuarios = useCallback(async () => {
    try {
      const data = await fetchUsuariosOpcoes()
      setUsuariosOpcoes(data)
    } catch {
      setUsuariosOpcoes([])
    }
  }, [])

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMetasDashboard({
        meses,
        dataInicio,
        dataFim,
        usuarioId: usuarioId || undefined,
        tipoMeta,
      })
      setStats(data)
    } catch (err) {
      setError(err.message || 'Erro ao carregar metas.')
    } finally {
      setLoading(false)
    }
  }, [meses, dataInicio, dataFim, usuarioId, tipoMeta])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleOpenContribuicoes = async (meta) => {
    setModalContribuicoes({
      usuarioId: meta.usuarioId,
      usuarioNome: meta.usuarioNome,
      tipo: meta.tipo,
      tipoLabel: meta.tipoLabel,
    })
    setLoadingContribuicoes(true)
    setContribuicoesError('')
    setContribuicoesData(null)

    try {
      const data = await fetchMetasContribuicoes({
        usuarioId: meta.usuarioId,
        tipoMeta: meta.tipo,
        dataInicio: meses === 'custom' ? dataInicio : undefined,
        dataFim: meses === 'custom' ? dataFim : undefined,
      })
      setContribuicoesData(data)
    } catch (err) {
      setContribuicoesError(err.message || 'Erro ao carregar histórico.')
    } finally {
      setLoadingContribuicoes(false)
    }
  }

  const handleCloseContribuicoes = () => {
    setModalContribuicoes(null)
    setContribuicoesData(null)
  }

  const getProgressBarColor = (progresso) => {
    if (progresso >= 100) return '#10b981' // Verde
    if (progresso >= 50) return '#0284c7'  // Azul
    return '#f59e0b'                       // Âmbar
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ATINGIDA':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#ecfdf5',
            color: '#059669',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            <CheckCircle2 size={12} /> Atingida
          </span>
        )
      case 'EM_ANDAMENTO':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#eff6ff',
            color: '#2563eb',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            <Clock size={12} /> Em andamento
          </span>
        )
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#f1f5f9',
            color: '#64748b',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            Não iniciada
          </span>
        )
    }
  }

  const kpis = stats?.kpis ?? {
    totalMetas: 0,
    metasAtingidas: 0,
    metasEmAndamento: 0,
    metasNaoIniciadas: 0,
    percentualMetasAtingidas: 0,
  }

  return (
    <>
      <Header
        title="Metas Comerciais"
        subtitle="Acompanhe o desempenho, metas atingidas e histórico de contribuições da equipe"
      />

      {/* Painel de Filtros */}
      <section className="filtersPanel">
        <label>
          <span>Período</span>
          <select
            value={meses}
            onChange={(e) => {
              const val = e.target.value === 'custom' ? 'custom' : Number(e.target.value)
              setMeses(val)
            }}
          >
            {PeriodoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </label>
            <label>
              <span>Data Fim</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </label>
          </>
        )}

        <label>
          <span>Vendedor</span>
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
          >
            <option value="">Todos os vendedores</option>
            {usuariosOpcoes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Tipo de Meta</span>
          <select
            value={tipoMeta}
            onChange={(e) => setTipoMeta(e.target.value)}
          >
            <option value="todos">Todas as Metas</option>
            <option value="leads">Meta de Leads (Prospecção)</option>
            <option value="negociacoes">Meta de Negociações</option>
          </select>
        </label>
      </section>

      {/* Indicadores Principais (KPIs) */}
      <section className="metricsGrid">
        <Metric
          title="Taxa de Metas Atingidas"
          value={`${kpis.percentualMetasAtingidas}%`}
          change={`${kpis.metasAtingidas} de ${kpis.totalMetas} metas batidas`}
        />
        <Metric
          title="Metas Batidas"
          value={kpis.metasAtingidas}
          change={kpis.metasAtingidas > 0 ? 'Parabéns à equipe!' : 'Aguardando fechamento'}
        />
        <Metric
          title="Metas em Andamento"
          value={kpis.metasEmAndamento}
          change="Atividades em curso"
        />
        <Metric
          title="Metas Não Iniciadas"
          value={kpis.metasNaoIniciadas}
          change="Sem resultado registrado"
        />
      </section>

      {loading && !stats && <p className="tableMessage">Carregando painel de metas...</p>}
      {error && <p className="formError">{error}</p>}

      {stats && stats.metas.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--color-border, #e2e8f0)',
          marginTop: '24px',
        }}>
          <Target size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text, #1e293b)' }}>
            Nenhuma meta ativa encontrada
          </h3>
          <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-muted, #64748b)', maxWidth: '480px', marginInline: 'auto' }}>
            Nenhum vendedor possui metas ativas para os filtros selecionados. Ative e configure as metas na edição de cada usuário.
          </p>
          {setScreen && (
            <button
              type="button"
              className="primaryBtn"
              onClick={() => setScreen('usuarios')}
            >
              <User size={16} />
              Ir para Usuários
            </button>
          )}
        </div>
      )}

      {stats && stats.metas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
          {/* Seção 1: Progresso Individual das Metas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: 'var(--color-primary, #0284c7)' }} />
                <h3 style={{ margin: 0 }}>Progresso por Meta</h3>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #64748b)' }}>
                {stats.metas.length} {stats.metas.length === 1 ? 'meta ativa' : 'metas ativas'}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}>
              {stats.metas.map((meta) => {
                const barColor = getProgressBarColor(meta.progressoPercentual)
                const percentualWidth = Math.min(100, meta.progressoPercentual)

                return (
                  <div
                    key={meta.id}
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Cabeçalho do Card */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: meta.usuarioAvatar ? `url(${meta.usuarioAvatar}) center/cover` : 'var(--color-primary-light, #e0f2fe)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          color: 'var(--color-primary, #0284c7)',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}>
                          {!meta.usuarioAvatar && (meta.usuarioNome?.[0] || 'U')}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--color-text, #0f172a)' }}>
                            {meta.usuarioNome}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                            {meta.usuarioCargo}
                          </span>
                        </div>
                      </div>
                      {renderStatusBadge(meta.status)}
                    </div>

                    {/* Identificador do Tipo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted, #475569)' }}>
                      {meta.tipo === 'LEADS' ? <Users size={16} /> : <Layers size={16} />}
                      <span>{meta.tipoLabel}</span>
                    </div>

                    {/* Valores: Realizado vs Alvo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text, #0f172a)' }}>
                          {meta.valorRealizado}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #64748b)', marginLeft: '4px' }}>
                          / {meta.valorAlvo} {meta.unidade}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: barColor }}>
                        {meta.progressoPercentual}%
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'var(--color-bg-alt, #f1f5f9)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${percentualWidth}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '999px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>

                    {/* Detalhe extra se for negociação */}
                    {meta.tipo === 'NEGOCIACOES' && meta.valorTotalEstimado > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                        Volume total em pipeline: <strong style={{ color: '#0f172a' }}>{formatValorFromAmount(meta.valorTotalEstimado)}</strong>
                      </div>
                    )}

                    {/* Botão de Histórico / Drilldown */}
                    <button
                      type="button"
                      className="secondaryBtn"
                      onClick={() => handleOpenContribuicoes(meta)}
                      style={{
                        marginTop: 'auto',
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        padding: '8px 12px',
                      }}
                    >
                      <ListFilter size={15} />
                      Ver Contribuições ({meta.valorRealizado})
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Seção 2: Comparação de Desempenho entre Usuários (Ranking / Leaderboard) */}
          {stats.ranking && stats.ranking.length > 0 && (
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Award size={20} style={{ color: '#eab308' }} />
                <h3 style={{ margin: 0 }}>Comparação de Desempenho entre Usuários</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.ranking.map((item) => {
                  const barColor = getProgressBarColor(item.mediaProgresso)
                  const percentualWidth = Math.min(100, item.mediaProgresso)

                  let medalIcon = null
                  if (item.posicao === 1) medalIcon = <Medal size={20} style={{ color: '#eab308' }} />
                  else if (item.posicao === 2) medalIcon = <Medal size={20} style={{ color: '#94a3b8' }} />
                  else if (item.posicao === 3) medalIcon = <Medal size={20} style={{ color: '#b45309' }} />

                  return (
                    <div
                      key={item.usuarioId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px minmax(180px, 1.2fr) minmax(120px, 2fr) 90px',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: item.posicao === 1 ? '#fefce8' : 'var(--color-bg-alt, #f8fafc)',
                        border: item.posicao === 1 ? '1px solid #fef08a' : '1px solid transparent',
                      }}
                    >
                      {/* Posição */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {medalIcon || <span style={{ color: '#64748b' }}>#{item.posicao}</span>}
                      </div>

                      {/* Usuário */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: item.avatarUrl ? `url(${item.avatarUrl}) center/cover` : 'var(--color-primary-light, #e0f2fe)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: 'var(--color-primary, #0284c7)',
                          flexShrink: 0,
                        }}>
                          {!item.avatarUrl && (item.nome?.[0] || 'U')}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--color-text, #0f172a)' }}>
                            {item.nome}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                            {item.cargo}
                          </span>
                        </div>
                      </div>

                      {/* Barra Comparativa */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          flex: 1,
                          height: '10px',
                          background: '#e2e8f0',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${percentualWidth}%`,
                            height: '100%',
                            background: barColor,
                            borderRadius: '999px',
                          }} />
                        </div>
                      </div>

                      {/* Percentual Médio */}
                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: barColor }}>
                        {item.mediaProgresso}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal / Drawer de Histórico de Contribuições */}
      {modalContribuicoes && (
        <div className="modalOverlay" onClick={handleCloseContribuicoes}>
          <div
            className="modalCard modalCardWide"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modalHeader">
              <div>
                <h3 style={{ margin: 0 }}>Histórico de Contribuições</h3>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #64748b)' }}>
                  {modalContribuicoes.usuarioNome} • {modalContribuicoes.tipoLabel}
                </span>
              </div>
              <button
                type="button"
                className="iconBtn"
                onClick={handleCloseContribuicoes}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              {loadingContribuicoes && <p className="tableMessage">Carregando histórico de resultados...</p>}
              {contribuicoesError && <p className="formError">{contribuicoesError}</p>}

              {contribuicoesData && contribuicoesData.contribuicoes.length === 0 && (
                <p className="tableMessage">Nenhum resultado registrado para esta meta no período avaliado.</p>
              )}

              {contribuicoesData && contribuicoesData.contribuicoes.length > 0 && (
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                        {modalContribuicoes.tipo === 'LEADS' ? 'Lead' : 'Negócio'}
                      </th>
                      <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                        {modalContribuicoes.tipo === 'LEADS' ? 'Empresa / Contato' : 'Lead / Empresa'}
                      </th>
                      {modalContribuicoes.tipo === 'NEGOCIACOES' && (
                        <th style={{ textAlign: 'right', padding: '10px 8px' }}>Valor Estimado</th>
                      )}
                      <th style={{ textAlign: 'left', padding: '10px 8px' }}>Status / Etapa</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px' }}>Data</th>
                      <th style={{ textAlign: 'center', padding: '10px 8px' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contribuicoesData.contribuicoes.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{item.titulo}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--color-text-muted, #64748b)', fontSize: '0.9rem' }}>
                          {item.subtitulo}
                        </td>
                        {modalContribuicoes.tipo === 'NEGOCIACOES' && (
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>
                            {formatValorFromAmount(item.valorEstimado)}
                          </td>
                        )}
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#f1f5f9',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)' }}>
                          {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {modalContribuicoes.tipo === 'LEADS' && onViewLead && (
                            <button
                              type="button"
                              className="secondaryBtn"
                              onClick={() => {
                                handleCloseContribuicoes()
                                onViewLead(item.id)
                              }}
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Abrir detalhes do Lead"
                            >
                              <ExternalLink size={14} />
                              Ver
                            </button>
                          )}
                          {modalContribuicoes.tipo === 'NEGOCIACOES' && onViewNegocio && (
                            <button
                              type="button"
                              className="secondaryBtn"
                              onClick={() => {
                                handleCloseContribuicoes()
                                onViewNegocio(item.id)
                              }}
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Abrir detalhes do Negócio"
                            >
                              <ExternalLink size={14} />
                              Ver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--color-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="secondaryBtn"
                onClick={handleCloseContribuicoes}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MetasDashboard

