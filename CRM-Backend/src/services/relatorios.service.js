import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateInput } from '../utils/date.js'
import { buildRelatorioExcelBuffer } from '../utils/relatorioExcel.js'
import { calcularTempoMedioPorEtapa } from './negocioEtapaHistorico.service.js'

const formatDateQuery = (date) => date.toISOString().slice(0, 10)

const parseRelatorioFilters = (query) => {
  const dataInicio = parseDateInput(query.dataInicio)
  const dataFim = parseDateInput(query.dataFim)

  if (!dataInicio) {
    const error = new Error(
      query.dataInicio ? ErrorMessages.relatorioDatasInvalidas : ErrorMessages.relatorioDataInicioRequired
    )
    error.statusCode = 400
    throw error
  }

  if (!dataFim) {
    const error = new Error(
      query.dataFim ? ErrorMessages.relatorioDatasInvalidas : ErrorMessages.relatorioDataFimRequired
    )
    error.statusCode = 400
    throw error
  }

  if (dataInicio > dataFim) {
    const error = new Error(ErrorMessages.relatorioPeriodoInvalido)
    error.statusCode = 400
    throw error
  }

  const fimDoDia = new Date(dataFim)
  fimDoDia.setHours(23, 59, 59, 999)

  let usuarioId = null
  if (query.usuarioId && query.usuarioId !== 'todos') {
    const parsed = Number(query.usuarioId)
    if (!Number.isNaN(parsed) && parsed > 0) {
      usuarioId = parsed
    }
  }

  return { dataInicio, dataFim: fimDoDia, usuarioId }
}

const resolveResponsavelLabel = async (usuarioId) => {
  if (!usuarioId) {
    return 'Todos os responsáveis'
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { nome: true },
  })

  return usuario?.nome ?? 'Responsável não encontrado'
}

const buildLeadWhere = (filters) => ({
  dataCadastro: {
    gte: filters.dataInicio,
    lte: filters.dataFim,
  },
  ...(filters.usuarioId ? { usuarioId: filters.usuarioId } : {}),
})

const buildNegocioWhere = (filters) => ({
  dataCriacao: {
    gte: filters.dataInicio,
    lte: filters.dataFim,
  },
  ...(filters.usuarioId ? { responsaveis: { some: { id: filters.usuarioId } } } : {}),
})

const getPrincipalMotivoPerda = (negocios) => {
  const counts = new Map()

  for (const negocio of negocios) {
    const motivo = negocio.motivoPerda?.nome
    if (!motivo) continue
    const key = motivo.trim()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let principal = null
  let max = 0

  for (const [motivo, total] of counts.entries()) {
    if (total > max) {
      max = total
      principal = motivo
    }
  }

  return principal
}

const buildTempoMedioPorEtapa = async (filters, excludedEtapaIds = []) => {
  const query = filters.usuarioId ? { usuarioId: String(filters.usuarioId) } : {}
  const tempoMedioMap = await calcularTempoMedioPorEtapa(query)

  const etapas = await prisma.etapaFunil.findMany({
    where: excludedEtapaIds.length > 0 ? { id: { notIn: excludedEtapaIds } } : undefined,
    orderBy: { ordem: 'asc' },
  })

  return etapas.map((etapa) => ({
    etapa: etapa.nome,
    diasMedio: tempoMedioMap[etapa.nome] ?? 0,
  }))
}

export const gerarRelatorio = async (query) => {
  const filters = parseRelatorioFilters(query)
  const leadWhere = buildLeadWhere(filters)
  const negocioWhere = buildNegocioWhere(filters)

  const [etapaFechado, etapaPerdida] = await Promise.all([
    prisma.etapaFunil.findFirst({ where: { nome: 'Fechado' } }),
    prisma.etapaFunil.findFirst({ where: { nome: 'Perdida' } }),
  ])

  const excludedEtapaIds = [etapaFechado?.id, etapaPerdida?.id].filter(Boolean)

  const [
    leadsNoPeriodo,
    negociosNoPeriodo,
    negociosAbertas,
    negociosFechadas,
    tempoMedioPorEtapa,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.negocio.findMany({
      where: negocioWhere,
      select: {
        id: true,
        etapaFunilId: true,
        motivoPerda: { select: { nome: true } },
      },
    }),
    prisma.negocio.count({
      where: {
        ...negocioWhere,
        ...(excludedEtapaIds.length > 0 ? { etapaFunilId: { notIn: excludedEtapaIds } } : {}),
      },
    }),
    etapaFechado
      ? prisma.negocio.count({
        where: {
          ...negocioWhere,
          etapaFunilId: etapaFechado.id,
        },
      })
      : Promise.resolve(0),
    buildTempoMedioPorEtapa(filters, excludedEtapaIds),
  ])

  const totalNegocios = negociosNoPeriodo.length
  const taxaConversao =
    totalNegocios > 0 ? Math.round((negociosFechadas / totalNegocios) * 100) : 0

  const principalMotivoPerda = getPrincipalMotivoPerda(negociosNoPeriodo)
  const responsavel = await resolveResponsavelLabel(filters.usuarioId)

  return {
    periodo: {
      dataInicio: formatDateQuery(filters.dataInicio),
      dataFim: formatDateQuery(filters.dataFim),
    },
    responsavel,
    usuarioId: filters.usuarioId,
    leadsNoPeriodo,
    negociosAbertas,
    negociosCriadas: totalNegocios,
    negociosFechadas,
    taxaConversao,
    principalMotivoPerda: principalMotivoPerda ?? 'Nenhum registro no período',
    tempoMedioPorEtapa,
  }
}

export const exportarRelatorioExcel = async (query) => {
  const relatorio = await gerarRelatorio(query)
  return buildRelatorioExcelBuffer(relatorio)
}
