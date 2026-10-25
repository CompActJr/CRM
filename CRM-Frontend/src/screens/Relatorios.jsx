import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, Download, Filter, RefreshCw, Users } from 'lucide-react'
import Header from '../components/layout/Header'
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

function Relatorios() {
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [usuarioId, setUsuarioId] = useState('todos')
  const [usuarios, setUsuarios] = useState([])
  const [opcoesLead, setOpcoesLead] = useState({ empresas: [], cidades: [], nichos: [], status: [] })
  const [filtrosLead, setFiltrosLead] = useState({ nomeLead: '', empresa: '', cidade: '', nicho: '', status: '' })
  const [relatorio, setRelatorio] = useState(null)
  const [filtrosAplicados, setFiltrosAplicados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsuariosOpcoes().then(setUsuarios).catch(() => setUsuarios([]))
    fetchRelatorioOpcoes().then(setOpcoesLead).catch(() => setOpcoesLead({ empresas: [], cidades: [], nichos: [], status: [] }))
  }, [])

  const buildParams = () => ({ ...period, usuarioId, ...filtrosLead })

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
        filtrosAplicados.nomeLead && `Lead: ${filtrosAplicados.nomeLead}`,
        filtrosAplicados.empresa && `Empresa: ${filtrosAplicados.empresa}`,
        filtrosAplicados.cidade && `Cidade: ${filtrosAplicados.cidade}`,
        filtrosAplicados.nicho && `Nicho: ${filtrosAplicados.nicho}`,
        filtrosAplicados.status && `Status: ${filtrosAplicados.status}`,
      ].filter(Boolean)
    : []

  return (
    <>
      <Header title="Relatórios" subtitle="Acompanhe resultados por período, responsável e perfil do lead" />

      <form className="filtersPanel reportFilters" onSubmit={handleGerar}>
        <label>
          <span>Data inicial</span>
          <input type="date" value={period.dataInicio} max={period.dataFim || undefined} onChange={(e) => updatePeriod('dataInicio', e.target.value)} required />
        </label>
        <label>
          <span>Data final</span>
          <input type="date" value={period.dataFim} min={period.dataInicio || undefined} onChange={(e) => updatePeriod('dataFim', e.target.value)} required />
        </label>
        <label>
          <span>Responsável</span>
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="todos">Todos os responsáveis</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Nome do lead</span>
          <input type="search" value={filtrosLead.nomeLead} onChange={(e) => updateLeadFilter('nomeLead', e.target.value)} placeholder="Pesquisar pelo nome" />
        </label>
        <label>
          <span>Empresa</span>
          <select value={filtrosLead.empresa} onChange={(e) => updateLeadFilter('empresa', e.target.value)}>
            <option value="">Todas as empresas</option>{renderFilterOptions(opcoesLead.empresas)}
          </select>
        </label>
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
          <p>Defina os filtros acima e gere o relatório para visualizar os indicadores comerciais.</p>
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
            <article className="metric reportMetric"><div className="reportMetricIcon blue"><Users size={19} /></div><span>Leads no período</span><strong>{relatorio.leadsNoPeriodo}</strong><small>novos leads cadastrados</small></article>
            <article className="metric reportMetric"><div className="reportMetricIcon violet"><BarChart3 size={19} /></div><span>Oportunidades criadas</span><strong>{relatorio.oportunidadesCriadas}</strong><small>no período selecionado</small></article>
            <article className="metric reportMetric"><div className="reportMetricIcon amber"><RefreshCw size={19} /></div><span>Oportunidades abertas</span><strong>{relatorio.oportunidadesAbertas}</strong><small>em andamento</small></article>
            <article className="metric reportMetric"><div className="reportMetricIcon green"><CheckCircle2 size={19} /></div><span>Oportunidades fechadas</span><strong>{relatorio.oportunidadesFechadas}</strong><small>concluídas com sucesso</small></article>
            <article className="metric reportMetric"><div className="reportMetricIcon green"><CheckCircle2 size={19} /></div><span>Taxa de conversão</span><strong>{relatorio.taxaConversao}%</strong><small>fechadas / criadas no período</small></article>
          </section>

          <section className="reportDetailsGrid">
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
          </section>
        </>
      )}
    </>
  )
}

export default Relatorios
