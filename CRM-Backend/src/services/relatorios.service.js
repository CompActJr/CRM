import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateInput } from '../utils/date.js'
import { buildRelatorioExcelBuffer } from '../utils/relatorioExcel.js'
import { buildRelatorioPdfBuffer } from '../utils/relatorioPdf.js'
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

  return {
    dataInicio,
    dataFim: fimDoDia,
    usuarioId,
    nomeLead: query.nomeLead?.trim() || null,
    empresa: query.empresa?.trim() || null,
    cidade: query.cidade?.trim() || null,
    nicho: query.nicho?.trim() || null,
    status: ['Ativo', 'Inativo'].includes(query.status) ? query.status : null,
  }
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
  ...buildLeadAttributeWhere(filters),
})

const buildLeadAttributeWhere = (filters) => ({
  ...(filters.nomeLead ? { nome: { contains: filters.nomeLead, mode: 'insensitive' } } : {}),
  ...(filters.empresa ? { empresa: filters.empresa } : {}),
  ...(filters.cidade ? { cidade: filters.cidade } : {}),
  ...(filters.nicho ? { nicho: filters.nicho } : {}),
  ...(filters.status ? { status: filters.status } : {}),
})

const buildNegocioWhere = (filters) => ({
  dataCriacao: {
    gte: filters.dataInicio,
    lte: filters.dataFim,
  },
  ...(filters.usuarioId ? { responsaveis: { some: { id: filters.usuarioId } } } : {}),
  ...(Object.keys(buildLeadAttributeWhere(filters)).length > 0
    ? { lead: { is: buildLeadAttributeWhere(filters) } }
    : {}),
})

const buildTempoMedioPorEtapa = async (filters, excludedEtapaIds = []) => {
  const query = {
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    ...(filters.usuarioId ? { usuarioId: String(filters.usuarioId) } : {}),
    ...(Object.keys(buildLeadAttributeWhere(filters)).length > 0
      ? { lead: { is: buildLeadAttributeWhere(filters) } }
      : {}),
  }
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

  const responsavel = await resolveResponsavelLabel(filters.usuarioId)

  return {
    periodo: {
      dataInicio: formatDateQuery(filters.dataInicio),
      dataFim: formatDateQuery(filters.dataFim),
    },
    responsavel,
    usuarioId: filters.usuarioId,
    filtros: {
      nomeLead: filters.nomeLead,
      empresa: filters.empresa,
      cidade: filters.cidade,
      nicho: filters.nicho,
      status: filters.status,
    },
    leadsNoPeriodo,
    negociosAbertas,
    negociosCriadas: totalNegocios,
    negociosFechadas,
    oportunidadesCriadas: totalNegocios,
    oportunidadesAbertas: negociosAbertas,
    oportunidadesFechadas: negociosFechadas,
    taxaConversao,
    tempoMedioPorEtapa,
  }
}

export const exportarRelatorioPdf = async (query) => {
  const relatorio = await gerarRelatorio(query)
  return buildRelatorioPdfBuffer(relatorio)
}

export const exportarRelatorioExcel = async (query) => {
  const relatorio = await gerarRelatorio(query)
  return buildRelatorioExcelBuffer(relatorio)
}

export const obterOpcoesRelatorio = async () => {
  const [empresas, cidades, nichos] = await Promise.all([
    prisma.lead.findMany({ where: { empresa: { not: null } }, select: { empresa: true }, distinct: ['empresa'], orderBy: { empresa: 'asc' } }),
    prisma.lead.findMany({ where: { cidade: { not: null } }, select: { cidade: true }, distinct: ['cidade'], orderBy: { cidade: 'asc' } }),
    prisma.lead.findMany({ where: { nicho: { not: null } }, select: { nicho: true }, distinct: ['nicho'], orderBy: { nicho: 'asc' } }),
  ])

  return {
    empresas: empresas.map(({ empresa }) => empresa).filter(Boolean),
    cidades: cidades.map(({ cidade }) => cidade).filter(Boolean),
    nichos: nichos.map(({ nicho }) => nicho).filter(Boolean),
    status: ['Ativo', 'Inativo'],
  }
}
