import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, Download, RefreshCw, Target, TrendingDown, Users } from 'lucide-react'
import Header from '../components/layout/Header'
import SearchableSelect, { buildUniqueSelectOptions } from '../components/common/SearchableSelect'
import TermometroMejCard from '../components/dashboard/TermometroMejCard'
import { downloadRelatorioExcel, downloadRelatorioPdf, fetchRelatorio, fetchRelatorioOpcoes } from '../services/relatoriosService'
import { fetchUsuariosOpcoes } from '../services/usuariosService'

const toLocalDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultPeriod = () => {
  const dataFim = new Date()
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - 30)
  return { dataInicio: toLocalDateInput(dataInicio), dataFim: toLocalDateInput(dataFim) }
}

const formatPeriod = (periodo) => {
  if (!periodo) return ''
  const format = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
  return `${format(periodo.dataInicio)} a ${format(periodo.dataFim)}`
}

const TipoMetaOptions = [
  { value: 'todos', label: 'Todas as metas' },
  { value: 'leads', label: 'Meta de Leads Mapeados' },
  { value: 'entradas_contato', label: 'Meta de Entradas de Contato' },
  { value: 'diagnosticos', label: 'Meta de Diagnósticos Marcados' },
]

const VisualizacaoPerdasOptions = [
  { value: 'tudo', label: 'Tudo junto' },
  { value: 'apenas_perdas', label: 'Apenas estatísticas de perdas' },
  { value: 'sem_perdas', label: 'Sem estatísticas de perdas' },
]

function Relatorios() {
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [usuarioId, setUsuarioId] = useState('todos')
  const [tipoMeta, setTipoMeta] = useState('todos')
  const [visualizacaoPerdas, setVisualizacaoPerdas] = useState('tudo')
  const [incluirTermometro, setIncluirTermometro] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [opcoesLead, setOpcoesLead] = useState({ nomes: [], empresas: [], cidades: [], nichos: [], status: [] })
  const [filtrosLead, setFiltrosLead] = useState({ nomeLead: '', empresa: '', cidade: '', nicho: '', status: '' })
  const [relatorio, setRelatorio] = useState(null)
  const [filtrosAplicados, setFiltrosAplicados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsuariosOpcoes().then(setUsuarios).catch(() => setUsuarios([]))
    fetchRelatorioOpcoes().then(setOpcoesLead).catch(() => setOpcoesLead({ nomes: [], empresas: [], cidades: [], nichos: [], status: [] }))
  }, [])

  const nomeLeadOptions = useMemo(
    () => buildUniqueSelectOptions(opcoesLead.nomes ?? [], (nome) => nome),
    [opcoesLead.nomes]
  )

  const empresaOptions = useMemo(
    () => buildUniqueSelectOptions(opcoesLead.empresas ?? [], (empresa) => empresa),
    [opcoesLead.empresas]
  )

  const buildParams = () => ({
    ...period,
    usuarioId,
    tipoMeta, visualizacaoPerdas,
    ...filtrosLead,
    ...(incluirTermometro ? { incluirTermometro: 'true' } : {}),
  })

  const handleGerar = async (event) => {
    event.preventDefault()
    if (!period.dataInicio || !period.dataFim) {
      setError('Informe as datas inicial e final para gerar o relatório.')
      return
    }
    if (period.dataInicio > period.dataFim) {
      setError('A data inicial deve ser anterior ou igual à data final.')
      return
    }

    const params = buildParams()
    setLoading(true)
    setError('')
    try {
      const data = await fetchRelatorio(params)
      setRelatorio(data)
      setFiltrosAplicados(params)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível gerar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async (format) => {
    if (!filtrosAplicados) return
    setExporting(true)
    setExportFormat(format)
    setError('')
    try {
      await (format === 'excel' ? downloadRelatorioExcel : downloadRelatorioPdf)(filtrosAplicados)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível exportar o PDF.')
    } finally {
      setExporting(false)
      setExportFormat('')
    }
  }

  const updatePeriod = (field, value) => setPeriod((current) => ({ ...current, [field]: value }))
  const updateLeadFilter = (field, value) => setFiltrosLead((current) => ({ ...current, [field]: value }))
  const renderFilterOptions = (items) => items.map((item) => <option key={item} value={item}>{item}</option>)
  const appliedLeadFilters = filtrosAplicados
    ? [
        filtrosAplicados.tipoMeta &&
          filtrosAplicados.tipoMeta !== 'todos' &&
          `Meta: ${TipoMetaOptions.find((opt) => opt.value === filtrosAplicados.tipoMeta)?.label || filtrosAplicados.tipoMeta}`,
        filtrosAplicados.nomeLead && `Lead: ${filtrosAplicados.nomeLead}`,
        filtrosAplicados.empresa && `Empresa: ${filtrosAplicados.empresa}`,
        filtrosAplicados.cidade && `Cidade: ${filtrosAplicados.cidade}`,
        filtrosAplicados.nicho && `Nicho: ${filtrosAplicados.nicho}`,
        filtrosAplicados.status && `Status: ${filtrosAplicados.status}`,
        filtrosAplicados.visualizacaoPerdas &&
          `Visualização: ${VisualizacaoPerdasOptions.find((opt) => opt.value === filtrosAplicados.visualizacaoPerdas)?.label || filtrosAplicados.visualizacaoPerdas}`,
        filtrosAplicados.incluirTermometro && 'Termômetro MEJ',
      ].filter(Boolean)
    : []
  const mostrarEstatisticasComerciais = relatorio?.visualizacaoPerdas !== 'apenas_perdas'
  const mostrarEstatisticasPerdas = relatorio?.visualizacaoPerdas !== 'sem_perdas'
  const maiorQuantidadePerdas = Math.max(1, ...(relatorio?.perdasPorPeriodo || []).map((item) => item.quantidade))

  return (
    <>
      <Header title="Relatórios" subtitle="Análise de leads, negócios e desempenho comercial" />

      <form className="filtersPanel reportFilters" onSubmit={handleGerar}>
        <label>
          <span>Data inicial</span>
          <input type="date" value={period.dataInicio} max={period.dataFim || undefined} onChange={(e) => updatePeriod('dataInicio', e.target.value)} required />
        </label>
        <label>
          <span>Data final</span>
          <input type="date" value={period.dataFim} min={period.dataInicio || undefined} onChange={(e) => updatePeriod('dataFim', e.target.value)} required />
        </label>
        <SearchableSelect
          label="Responsável"
          placeholder="Todos os responsáveis"
          searchPlaceholder="Buscar responsável..."
          options={usuarios.map((usuario) => ({
            value: String(usuario.id),
            label: usuario.nome,
          }))}
          value={usuarioId}
          emptyValue="todos"
          onChange={(val) => setUsuarioId(val || 'todos')}
        />
        <SearchableSelect
          label="Nome do lead"
          placeholder="Todos os leads"
          searchPlaceholder="Pesquisar pelo nome..."
          options={nomeLeadOptions}
          value={filtrosLead.nomeLead}
          onChange={(val) => updateLeadFilter('nomeLead', val)}
        />
        <SearchableSelect
          label="Empresa"
          placeholder="Todas as empresas"
          searchPlaceholder="Buscar empresa..."
          options={empresaOptions}
          value={filtrosLead.empresa}
          onChange={(val) => updateLeadFilter('empresa', val)}
        />
        <label>
          <span>Cidade</span>
          <select value={filtrosLead.cidade} onChange={(e) => updateLeadFilter('cidade', e.target.value)}>
            <option value="">Todas as cidades</option>{renderFilterOptions(opcoesLead.cidades)}
          </select>
        </label>
        <label>
          <span>Nicho</span>
          <select value={filtrosLead.nicho} onChange={(e) => updateLeadFilter('nicho', e.target.value)}>
            <option value="">Todos os nichos</option>{renderFilterOptions(opcoesLead.nichos)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={filtrosLead.status} onChange={(e) => updateLeadFilter('status', e.target.value)}>
            <option value="">Todos os status</option>{renderFilterOptions(opcoesLead.status)}
          </select>
        </label>
        <label>
          <span>Tipo de meta</span>
          <select value={tipoMeta} onChange={(e) => setTipoMeta(e.target.value)}>
            {TipoMetaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
        <label>
          <span>Estatísticas de perdas</span>
          <select value={visualizacaoPerdas} onChange={(e) => setVisualizacaoPerdas(e.target.value)}>
            {VisualizacaoPerdasOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
        <label className="reportCheckboxLabel">
          <input
            type="checkbox"
            checked={incluirTermometro}
            onChange={(e) => setIncluirTermometro(e.target.checked)}
          />
          <span>Incluir métricas do Termômetro MEJ</span>
        </label>
        <button type="submit" className="primaryBtn reportGenerateBtn" disabled={loading || exporting}>
          {loading ? <RefreshCw size={18} className="reportSpinner" /> : <BarChart3 size={18} />}
          {loading ? 'Gerando...' : 'Gerar relatório'}
        </button>
      </form>

      {error && <p className="formError" role="alert">{error}</p>}

      {!relatorio ? (
        <section className="panel reportEmptyState">
          <div className="reportEmptyIcon"><BarChart3 size={24} /></div>
          <h2>Seu relatório aparecerá aqui</h2>
          <p>Defina os filtros acima e gere o relatório para visualizar as estatísticas do período.</p>
        </section>
      ) : (
        <>
          <section className="reportResultsHeader">
            <div>
              <span className="reportEyebrow">RESULTADO DO PERÍODO</span>
              <h2>{formatPeriod(relatorio.periodo)}</h2>
              <p>Responsável: <strong>{relatorio.responsavel}</strong></p>
              {appliedLeadFilters.length > 0 && <p className="reportAppliedFilters">Filtros: {appliedLeadFilters.join(' · ')}</p>}
            </div>
            <div className="reportExportButtons">
              <button type="button" className="secondaryBtn" onClick={() => handleExportar('excel')} disabled={exporting || loading}>
                <Download size={18} />{exportFormat === 'excel' ? 'Preparando Excel...' : 'Baixar planilha Excel'}
              </button>
              <button type="button" className="primaryBtn" onClick={() => handleExportar('pdf')} disabled={exporting || loading}>
                <Download size={18} />{exportFormat === 'pdf' ? 'Preparando PDF...' : 'Baixar relatório PDF'}
              </button>
            </div>
          </section>

          <section className="reportMetricsGrid">
            {mostrarEstatisticasComerciais && <>
              <article className="metric reportMetric"><div className="reportMetricIcon blue"><Users size={19} /></div><span>Leads no período</span><strong>{relatorio.leadsNoPeriodo}</strong><small>novos leads cadastrados</small></article>
              <article className="metric reportMetric"><div className="reportMetricIcon violet"><BarChart3 size={19} /></div><span>Negócios criados</span><strong>{relatorio.negociosCriadas}</strong><small>no período selecionado</small></article>
              <article className="metric reportMetric"><div className="reportMetricIcon amber"><RefreshCw size={19} /></div><span>Negócios abertos</span><strong>{relatorio.negociosAbertas}</strong><small>em andamento</small></article>
              <article className="metric reportMetric"><div className="reportMetricIcon green"><CheckCircle2 size={19} /></div><span>Negócios fechados</span><strong>{relatorio.negociosFechadas}</strong><small>concluídos com sucesso</small></article>
              <article className="metric reportMetric"><div className="reportMetricIcon green"><CheckCircle2 size={19} /></div><span>Taxa de conversão</span><strong>{relatorio.taxaConversao}%</strong><small>fechadas / criadas no período</small></article>
            </>}
            {mostrarEstatisticasPerdas && (
              <article className="metric reportMetric">
                <div className="reportMetricIcon red"><TrendingDown size={19} /></div>
                <span>Negócios perdidos</span>
                <strong>{relatorio.perdasNoPeriodo}</strong>
                <small>marcados como perdidos no período</small>
              </article>
            )}
          </section>

          {relatorio.termometroMej && (
            <TermometroMejCard
              termometro={relatorio.termometroMej}
              loading={false}
              isAdmin={false}
            />
          )}

          {relatorio.termometroMej && (
            <TermometroMejCard
              termometro={relatorio.termometroMej}
              loading={false}
              isAdmin={false}
            />
          )}

          {mostrarEstatisticasPerdas && (
            <section className="panel reportLossStats">
              <div className="reportLossStatsHeader">
                <div>
                  <h2>Perdas por período</h2>
                  <p>Quantidade de negócios marcados como perdidos {relatorio.agrupamentoPerdas === 'dia' ? 'por dia' : 'por mês'}.</p>
                </div>
                <span className="reportLossTotal">{relatorio.perdasNoPeriodo} perdas</span>
              </div>
              {relatorio.perdasPorPeriodo?.length ? (
                <div className="reportLossTableWrap">
                  <table className="reportLossTable">
                    <thead><tr><th>Período</th><th>Quantidade</th><th aria-label="Representação visual" /></tr></thead>
                    <tbody>
                      {relatorio.perdasPorPeriodo.map((item) => (
                        <tr key={item.periodo}>
                          <th scope="row">{item.periodo}</th>
                          <td>{item.quantidade}</td>
                          <td>
                            <div className="reportLossBarTrack" aria-label={`${item.quantidade} perdas`}>
                              <span style={{ width: `${(item.quantidade / maiorQuantidadePerdas) * 100}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="tableMessage">Nenhuma perda no período selecionado.</p>}
            </section>
          )}

          {mostrarEstatisticasPerdas && (
            <section className="panel reportLossStats">
              <div className="reportLossStatsHeader">
                <div>
                  <h2>Perdas por motivo</h2>
                  <p>Distribuição dos motivos informados ao marcar negócios como perdidos.</p>
                </div>
              </div>
              {relatorio.perdasPorMotivo?.length ? (
                <div className="reportLossTableWrap">
                  <table className="reportLossTable reportLossReasonTable">
                    <thead><tr><th>Motivo</th><th>Quantidade</th><th>Percentual</th></tr></thead>
                    <tbody>
                      {relatorio.perdasPorMotivo.map((item) => (
                        <tr key={item.motivo}>
                          <th scope="row">{item.motivo}</th>
                          <td>{item.quantidade}</td>
                          <td>{item.percentual}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="tableMessage">Nenhum motivo de perda no período selecionado.</p>}
            </section>
          )}

          {mostrarEstatisticasComerciais && <section className="gridTwo reportDetailsGrid">
            <div className="panel">
              <h2>Tempo médio por etapa</h2>
              {relatorio.tempoMedioPorEtapa?.length ? (
                <div className="stageList">
                  {relatorio.tempoMedioPorEtapa.map((item) => (
                    <div className="stageRow" key={item.etapa}><span>{item.etapa}</span><strong>{item.diasMedio} dias</strong></div>
                  ))}
                </div>
              ) : <p className="tableMessage">Não há etapas para exibir.</p>}
            </div>

            <div className="panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} style={{ color: 'var(--color-primary, #0284c7)' }} />
                  Metas no período
                </h2>
                {relatorio.metas?.kpis && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary, #0284c7)' }}>
                    {relatorio.metas.kpis.percentualMetasAtingidas}% atingidas ({relatorio.metas.kpis.metasAtingidas}/{relatorio.metas.kpis.totalMetas})
                  </span>
                )}
              </div>

              {relatorio.metas?.metas?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatorio.metas.metas.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--color-bg-alt, #f8fafc)',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border, #e2e8f0)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--color-text, #0f172a)' }}>
                            {item.usuarioNome}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', display: 'block' }}>
                            {item.tipoLabel}
                            {item.periodoInicio && item.periodoFim
                              ? ` · ${formatPeriod({ dataInicio: item.periodoInicio, dataFim: item.periodoFim })}`
                              : ''}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: item.progressoPercentual >= 100 ? '#10b981' : item.progressoPercentual >= 50 ? '#0284c7' : '#f59e0b',
                          }}>
                            {item.progressoPercentual}%
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', display: 'block' }}>
                            {item.valorRealizado} / {item.valorAlvo} {item.unidade}
                          </span>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--color-secondary-bg, #e2e8f0)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, item.progressoPercentual)}%`,
                            height: '100%',
                            background: item.progressoPercentual >= 100 ? '#10b981' : item.progressoPercentual >= 50 ? '#0284c7' : '#f59e0b',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tableMessage">Nenhuma meta configurada para o período selecionado.</p>
              )}
            </div>
          </section>}
        </>
      )}
    </>
  )
}

export default Relatorios
