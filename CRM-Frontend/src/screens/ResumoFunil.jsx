import { useCallback, useEffect, useMemo, useState } from 'react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import Header from '../components/layout/Header'
import FiltroResponsavel from '../components/filtros/FiltroResponsavel'
import { loginLogoPath } from '../assets/assetsConfig'
import { fetchEtapasFunil } from '../services/etapasService'
import { fetchNegociosFunil } from '../services/negociosService'
import { getFunilCardDisplayTitle, getTemperaturaInfo } from '../utils/funilDrag'

const normalizeStageName = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const FunilResumoSections = [
  {
    key: 'diagnosticos',
    title: 'Diagnósticos a Realizar',
    matches: (normalizedName, ordem) =>
      normalizedName.includes('diagnostico') || ordem === 3,
  },
  {
    key: 'propostas',
    title: 'Propostas a Apresentar',
    matches: (normalizedName, ordem) =>
      normalizedName.includes('proposta') || ordem === 4,
  },
  {
    key: 'followUp',
    title: 'Follow UP',
    matches: (normalizedName, ordem) =>
      normalizedName.includes('follow') ||
      normalizedName.includes('negociacao') ||
      ordem === 5,
  },
]

function ResumoFunil({ onViewNegocio, onViewLead }) {
  const [funil, setFunil] = useState({})
  const [etapas, setEtapas] = useState([])
  const [responsavelId, setResponsavelId] = useState('')
  const [isCaptureMode, setIsCaptureMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadResumo = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [funilResponse, etapasData] = await Promise.all([
        fetchNegociosFunil(),
        fetchEtapasFunil(),
      ])
      setFunil(funilResponse.funil ?? funilResponse)
      setEtapas(etapasData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResumo()
  }, [loadResumo])

  useEffect(() => {
    if (!isCaptureMode) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCaptureMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCaptureMode])

  const sections = useMemo(() => {
    const etapaByNome = new Map(etapas.map((e) => [e.nome, e]))
    const stageNames = new Set([...etapas.map((e) => e.nome), ...Object.keys(funil)])
    const targetUserId = responsavelId ? Number(responsavelId) : null

    return FunilResumoSections.map((section) => {
      const items = []
      for (const stageName of stageNames) {
        const etapaMeta = etapaByNome.get(stageName)
        const normalized = normalizeStageName(stageName)
        if (section.matches(normalized, etapaMeta?.ordem)) {
          for (const item of funil[stageName] ?? []) {
            if (targetUserId) {
              const matchesUser =
                item.responsaveisIds?.includes(targetUserId) ||
                Number(item.usuarioId) === targetUserId
              if (!matchesUser) continue
            }
            items.push(item)
          }
        }
      }

      return {
        ...section,
        items,
      }
    })
  }, [etapas, funil, responsavelId])

  const handleOpenItem = (item) => {
    if (item.tipoCard === 'lead' && onViewLead) {
      onViewLead(item.leadId)
      return
    }
    if (onViewNegocio) {
      onViewNegocio(item.negocioId ?? item.id)
    }
  }

  const board = (
    <section className="funilSummaryBoard" aria-label="Situação do Funil">
      <div className="funilSummarySidebar">
        <span>Situação do Funil</span>
      </div>

      <div className="funilSummaryContent">
        {sections.map((section) => (
          <div key={section.key} className="funilSummarySection">
            <div className="funilSummarySectionBody">
              <span className="funilSummaryStageBadge">{section.title}</span>
              {section.items.length === 0 ? (
                <span className="funilSummaryEmpty">Nenhum item nesta etapa</span>
              ) : (
                section.items.map((item) => {
                  const temp = getTemperaturaInfo(item.diasNaEtapa)
                  const title = getFunilCardDisplayTitle(item)
                  const tooltipParts = [
                    title,
                    item.lead && item.empresa && item.lead !== item.empresa ? item.lead : null,
                    temp.label,
                    item.responsavel || 'Sem responsável',
                  ].filter(Boolean)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`funilSummaryPill ${temp.key}`}
                      title={tooltipParts.join(' • ')}
                      onClick={() => handleOpenItem(item)}
                    >
                      {title}
                    </button>
                  )
                })
              )}
            </div>
            <div className="funilSummaryCount">{section.items.length}</div>
          </div>
        ))}

        <div className="funilSummaryFooter">
          <div className="funilSummaryLegend">
            <span className="funilSummaryLegendItem">
              <span className="funilSummaryLegendDot quente" />
              Quente (&lt; 5 dias)
            </span>
            <span className="funilSummaryLegendItem">
              <span className="funilSummaryLegendDot morno" />
              Morno (5–6 dias)
            </span>
            <span className="funilSummaryLegendItem">
              <span className="funilSummaryLegendDot frio" />
              Frio (7+ dias)
            </span>
          </div>

          <div className="funilSummaryBrand">
            <img src={loginLogoPath} alt="CRM CompAct.Jr" />
            <span>CRM CompAct.Jr</span>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <>
      <Header
        title="Resumo do Funil"
        subtitle="Painel consolidado de diagnósticos, propostas e follow-up para capturas de tela"
      />

      <div className="toolbar funilSummaryToolbar">
        <FiltroResponsavel value={responsavelId} onChange={setResponsavelId} />

        <div className="funilSummaryToolbarActions">
          <button type="button" className="secondaryBtn" onClick={loadResumo} disabled={loading}>
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button
            type="button"
            className="primaryBtn"
            onClick={() => setIsCaptureMode(true)}
            disabled={loading}
          >
            <Maximize2 size={16} />
            Modo Captura
          </button>
        </div>
      </div>

      {error && <p className="formError">{error}</p>}

      {loading ? (
        <p className="tableMessage">Carregando resumo do funil...</p>
      ) : isCaptureMode ? (
        <div className="funilSummaryCaptureOverlay">
          <div className="funilSummaryCaptureBar">
            <button
              type="button"
              className="secondaryBtn"
              onClick={() => setIsCaptureMode(false)}
            >
              <Minimize2 size={16} />
              Sair do Modo Captura (Esc)
            </button>
          </div>
          {board}
        </div>
      ) : (
        board
      )}
    </>
  )
}

export default ResumoFunil

