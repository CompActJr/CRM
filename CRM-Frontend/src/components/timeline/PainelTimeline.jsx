import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CheckSquare,
  FileText,
  MessageSquare,
  MoveRight,
  UserRound,
} from 'lucide-react'
import FiltroResponsavel from '../filtros/FiltroResponsavel'
import { fetchTimelineByLead, fetchTimelineByNegocio } from '../../services/timelineService'

const TipoIcons = {
  interacao: MessageSquare,
  tarefa: CheckSquare,
  etapa: MoveRight,
  proposta: FileText,
  negocio: Briefcase,
  responsavel: UserRound,
}

const TipoLabels = {
  responsavel: 'Responsáveis',
  interacao: 'Interações',
  tarefa: 'Tarefas',
  etapa: 'Funil',
  proposta: 'Propostas',
  negocio: 'Negócios',
}

const labelsEscopo = {
  lead: 'Responsável pelo lead',
  negocio: 'Responsáveis pelo negócio',
}

const ordenacoes = {
  desc: 'Data mais recente primeiro',
  asc: 'Data mais antiga primeiro',
}

const matchResponsavel = (evento, usuarioId) =>
  evento.responsavelId === usuarioId ||
  (evento.responsaveis ?? []).some((item) => item.id === usuarioId)

function PainelTimeline({ leadId, negocioId }) {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [responsavelFilter, setResponsavelFilter] = useState('')
  const [ordem, setOrdem] = useState('desc')

  useEffect(() => {
    let ativo = true

    const loadTimeline = async () => {
      setLoading(true)
      setError('')
      try {
        const data = negocioId
          ? await fetchTimelineByNegocio(negocioId)
          : await fetchTimelineByLead(leadId)
        if (ativo) setEventos(data)
      } catch (requestError) {
        if (ativo) setError(requestError.message)
      } finally {
        if (ativo) setLoading(false)
      }
    }

    loadTimeline()

    return () => {
      ativo = false
    }
  }, [leadId, negocioId])

  const eventosVisiveis = useMemo(() => {
    const usuarioId = Number(responsavelFilter)
    const filtrados = eventos.filter((evento) => {
      const matchesTipo = !tipoFilter || evento.tipo === tipoFilter
      const matchesResponsavel = !usuarioId || matchResponsavel(evento, usuarioId)
      return matchesTipo && matchesResponsavel
    })

    return [...filtrados].sort((a, b) => {
      const diff = new Date(a.data).getTime() - new Date(b.data).getTime()
      const comparacao = diff !== 0 ? diff : a.id.localeCompare(b.id)
      return ordem === 'asc' ? comparacao : -comparacao
    })
  }, [eventos, tipoFilter, responsavelFilter, ordem])

  if (loading) {
    return <p className="tableMessage">Carregando histórico...</p>
  }

  if (error) {
    return <p className="formError">{error}</p>
  }

  if (eventos.length === 0) {
    return <p className="tableMessage">Nenhum registro no histórico.</p>
  }

  return (
    <div className="leadTabContent">
      <div className="timelineFilters">
        <select
          aria-label="Filtrar por tipo de registro"
          value={tipoFilter}
          onChange={(event) => setTipoFilter(event.target.value)}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TipoLabels).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
        <FiltroResponsavel value={responsavelFilter} onChange={setResponsavelFilter} />
        <select
          aria-label="Ordenar registros"
          value={ordem}
          onChange={(event) => setOrdem(event.target.value)}
        >
          {Object.entries(ordenacoes).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
        <span className="timelineFiltersCount">
          {eventosVisiveis.length} de {eventos.length} registro(s)
        </span>
      </div>

      {eventosVisiveis.length === 0 ? (
        <p className="tableMessage">Nenhum registro encontrado com os filtros aplicados.</p>
      ) : (
        <div className="timelineList">
          {eventosVisiveis.map((evento) => {
            const Icone = TipoIcons[evento.tipo] ?? MessageSquare
            const rodape = [evento.responsavel, evento.detalhe].filter(Boolean).join(' · ')
            const nomesResponsaveis = (evento.responsaveis ?? [])
              .map((item) => item.nome)
              .filter(Boolean)

            return (
              <article className="timelineCard" key={evento.id}>
                <div className="timelineMeta">
                  <div className={`timelineBadge timelineBadge-${evento.tipo}`}>
                    <Icone size={14} />
                    {evento.tipoLabel}
                  </div>
                  <span>{evento.dataFormatada}</span>
                </div>
                <strong className="timelineEventoTitulo">{evento.evento}</strong>
                {evento.descricao && <p>{evento.descricao}</p>}
                {(rodape || evento.negocioTitulo) && (
                  <div className="timelineMeta timelineCardFooter">
                    {rodape && <span>{rodape}</span>}
                    {evento.negocioTitulo && (
                      <span className="timelineNegocioTag">{evento.negocioTitulo}</span>
                    )}
                  </div>
                )}
                {nomesResponsaveis.length > 0 && (
                  <div className="timelineResponsaveis">
                    <UserRound size={14} />
                    <span>
                      {labelsEscopo[evento.escopo] ?? labelsEscopo.lead}:{' '}
                      {nomesResponsaveis.join(', ')}
                    </span>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PainelTimeline
