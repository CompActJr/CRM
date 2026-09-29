import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Filter } from 'lucide-react'
import Header from '../components/layout/Header'
import { downloadRelatorioExcel, fetchRelatorio } from '../services/relatoriosService'
import { fetchUsuariosOpcoes } from '../services/usuariosService'

const getDefaultPeriod = () => {
  const dataFim = new Date()
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - 30)
  return {
    dataInicio: dataInicio.toISOString().slice(0, 10),
    dataFim: dataFim.toISOString().slice(0, 10),
  }
}

function Relatorios() {
  const defaultPeriod = getDefaultPeriod()
  const [dataInicio, setDataInicio] = useState(defaultPeriod.dataInicio)
  const [dataFim, setDataFim] = useState(defaultPeriod.dataFim)
  const [usuarioId, setUsuarioId] = useState('todos')
  const [usuarios, setUsuarios] = useState([])
  const [relatorio, setRelatorio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const data = await fetchUsuariosOpcoes()
        setUsuarios(data)
      } catch {
        setUsuarios([])
      }
    }
    loadUsuarios()
  }, [])

  const buildParams = () => ({
    dataInicio,
    dataFim,
    usuarioId,
  })

  const handleGerar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchRelatorio(buildParams())
      setRelatorio(data)
    } catch (requestError) {
      setRelatorio(null)
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async () => {
    setExporting(true)
    setError('')
    try {
      await downloadRelatorioExcel(buildParams())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Header title="Relatórios" subtitle="Análise de leads, oportunidades e desempenho comercial" />
      <section className="filtersPanel">
        <label>
          <span>Data inicial</span>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label>
          <span>Data final</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <label>
          <span>Responsável</span>
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="todos">Todos</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="primaryBtn" onClick={handleGerar} disabled={loading} style={{ marginTop: '10px' }}>
          <Filter size={18} />
          {loading ? 'Gerando...' : 'Gerar relatório'}
        </button>
      </section>
      {error && <p className="formError">{error}</p>}
      <section className="gridTwo">
        <div className="panel">
          <h2>Resultados</h2>
          {!relatorio ? (
            <p className="tableMessage">Selecione o período e clique em Gerar relatório.</p>
          ) : (
            <>
              <ul className="reportList">
                <li>
                  <CheckCircle2 size={18} />
                  Responsável: <strong>{relatorio.responsavel}</strong>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Leads no período: <strong>{relatorio.leadsNoPeriodo}</strong>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Oportunidades abertas no período: <strong>{relatorio.oportunidadesAbertas}</strong>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Oportunidades fechadas no período: <strong>{relatorio.oportunidadesFechadas}</strong>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Taxa de conversão: <strong>{relatorio.taxaConversao}%</strong>
                </li>
                <li>
                  <AlertTriangle size={18} />
                  Principal motivo de perda: <strong>{relatorio.principalMotivoPerda}</strong>
                </li>
              </ul>
              <button
                type="button"
                className="primaryBtn"
                onClick={handleExportar}
                disabled={exporting}
              >
                <Download size={18} />
                {exporting ? 'Exportando...' : 'Exportar relatório (Excel)'}
              </button>
              <p className="reportExportHint">
                Para ver cores e layout, abra o arquivo .xlsx no Microsoft Excel (o Google Planilhas remove
                parte da formatação).
              </p>
            </>
          )}
        </div>
        <div className="panel">
          <h2>Tempo médio por etapa</h2>
          {!relatorio ? (
            <p className="tableMessage">Os indicadores aparecem após gerar o relatório.</p>
          ) : (
            <div className="stageList">
              {relatorio.tempoMedioPorEtapa.map((item) => (
                <div className="stageRow" key={item.etapa}>
                  <span>{item.etapa}</span>
                  <strong>{item.diasMedio} dias</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Relatorios
