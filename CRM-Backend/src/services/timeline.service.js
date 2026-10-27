import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import {
  aplicarResponsaveisNaTimeline,
  buildEtapaEvento,
  buildInteracaoEvento,
  buildNegocioEvento,
  buildPropostaEvento,
  buildResponsavelEventos,
  buildTarefaEventos,
  mapPrimeiraEtapaPorNegocio,
  sortEventosTimeline,
  timelineEtapaInclude,
  timelineInteracaoInclude,
  timelineLeadResponsavelInclude,
  timelineNegocioResponsavelInclude,
  timelineNegocioSelect,
  timelinePropostaInclude,
  timelineTarefaInclude,
} from '../utils/timelineMapper.js'

const parseId = (value) => {
  const parsed = Number(value)
  if (!value || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const buildEventosDeResponsaveis = (registros, escopo) =>
  registros.flatMap((registro) => buildResponsavelEventos(registro, escopo))

export const getTimelineByLead = async (leadIdParam) => {
  const leadId = parseId(leadIdParam)
  if (!leadId) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, negocios: { select: { id: true } } },
  })
  if (!lead) {
    const error = new Error(ErrorMessages.leadNotFound)
    error.statusCode = 404
    throw error
  }

  const negocioIds = lead.negocios.map((negocio) => negocio.id)

  const [
    interacoes,
    tarefas,
    negocios,
    historicoEtapas,
    propostas,
    historicoLead,
    historicoNegocio,
  ] = await Promise.all([
    prisma.interacao.findMany({
      where: { leadId },
      include: timelineInteracaoInclude,
      orderBy: { dataInteracao: 'desc' },
    }),
    prisma.tarefa.findMany({ where: { leadId }, include: timelineTarefaInclude }),
    prisma.negocio.findMany({ where: { leadId }, select: timelineNegocioSelect }),
    negocioIds.length
      ? prisma.negocioEtapaHistorico.findMany({
          where: { negocioId: { in: negocioIds } },
          include: timelineEtapaInclude,
          orderBy: { entradaEm: 'desc' },
        })
      : [],
    negocioIds.length
      ? prisma.proposta.findMany({
          where: { negocioId: { in: negocioIds } },
          include: timelinePropostaInclude,
        })
      : [],
    prisma.leadResponsavelHistorico.findMany({
      where: { leadId },
      include: timelineLeadResponsavelInclude,
      orderBy: { entradaEm: 'asc' },
    }),
    negocioIds.length
      ? prisma.negocioResponsavelHistorico.findMany({
          where: { negocioId: { in: negocioIds } },
          include: timelineNegocioResponsavelInclude,
          orderBy: { entradaEm: 'asc' },
        })
      : [],
  ])

  const primeiraEtapa = mapPrimeiraEtapaPorNegocio(historicoEtapas)

  const eventos = sortEventosTimeline([
    ...interacoes.map(buildInteracaoEvento),
    ...tarefas.flatMap(buildTarefaEventos),
    ...negocios.map((negocio) => buildNegocioEvento(negocio, primeiraEtapa.get(negocio.id))),
    ...historicoEtapas.map(buildEtapaEvento),
    ...propostas.map(buildPropostaEvento),
    ...buildEventosDeResponsaveis(historicoLead, 'lead'),
    ...buildEventosDeResponsaveis(historicoNegocio, 'negocio'),
  ])

  return aplicarResponsaveisNaTimeline(eventos, {
    historicoLead,
    historicoNegocio,
  })
}

export const getTimelineByNegocio = async (negocioIdParam) => {
  const negocioId = parseId(negocioIdParam)
  if (!negocioId) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: timelineNegocioSelect,
  })
  if (!negocio) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  const [interacoes, tarefas, historicoEtapas, propostas, historicoNegocio] =
    await Promise.all([
      prisma.interacao.findMany({
        where: { negocioId },
        include: timelineInteracaoInclude,
        orderBy: { dataInteracao: 'desc' },
      }),
      prisma.tarefa.findMany({ where: { negocioId }, include: timelineTarefaInclude }),
      prisma.negocioEtapaHistorico.findMany({
        where: { negocioId },
        include: timelineEtapaInclude,
        orderBy: { entradaEm: 'desc' },
      }),
      prisma.proposta.findMany({
        where: { negocioId },
        include: timelinePropostaInclude,
      }),
      prisma.negocioResponsavelHistorico.findMany({
        where: { negocioId },
        include: timelineNegocioResponsavelInclude,
        orderBy: { entradaEm: 'asc' },
      }),
    ])

  const eventos = sortEventosTimeline([
    ...interacoes.map(buildInteracaoEvento),
    ...tarefas.flatMap(buildTarefaEventos),
    buildNegocioEvento(negocio, mapPrimeiraEtapaPorNegocio(historicoEtapas).get(negocio.id)),
    ...historicoEtapas.map(buildEtapaEvento),
    ...propostas.map(buildPropostaEvento),
    ...buildEventosDeResponsaveis(historicoNegocio, 'negocio'),
  ])

  return aplicarResponsaveisNaTimeline(eventos, { historicoNegocio })
}
