import { ErrorMessages, NEGOCIO_PERDIDO_INTERACAO_PREFIX } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateInput, parseDateTimeInput } from '../utils/date.js'
import { buildRelatorioExcelBuffer } from '../utils/relatorioExcel.js'
import { buildRelatorioPdfBuffer } from '../utils/relatorioPdf.js'
import { calcularTempoMedioPorEtapa } from './negocioEtapaHistorico.service.js'
import { getMetasDashboardStats, normalizeTipoMeta } from './metas.service.js'

const TipoMetaLabels = {
  LEADS: 'Meta de Leads Mapeados',
  ENTRADAS_CONTATO: 'Meta de Entradas de Contato',
  DIAGNOSTICOS: 'Meta de Diagnósticos Marcados',
}

const SaoPauloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const getDateKeyInSaoPaulo = (date) => {
  const parts = Object.fromEntries(
    SaoPauloDateFormatter.formatToParts(date).map(({ type, value }) => [type, value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

const formatDateKeyBr = (dateKey) => dateKey.split('-').reverse().join('/')

const getLossPeriodBuckets = (dataInicio, dataFim) => {
  const start = new Date(`${dataInicio}T12:00:00Z`)
  const end = new Date(`${dataFim}T12:00:00Z`)
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1

  if (dayCount <= 31) {
    return {
      agrupamento: 'dia',
      buckets: Array.from({ length: dayCount }, (_unused, index) => {
        const date = new Date(start)
        date.setUTCDate(date.getUTCDate() + index)
        const key = date.toISOString().slice(0, 10)
        return { chave: key, periodo: formatDateKeyBr(key), quantidade: 0 }
      }),
    }
  }

  const buckets = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1, 12))
  const lastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1, 12))
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  while (cursor <= lastMonth) {
    const key = cursor.toISOString().slice(0, 7)
    buckets.push({
      chave: key,
      periodo: formatter.format(cursor),
      quantidade: 0,
    })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return { agrupamento: 'mes', buckets }
}

const buildLossStats = (historicoPerdas, filters) => {
  const { agrupamento, buckets } = getLossPeriodBuckets(filters.dataInicioStr, filters.dataFimStr)
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.chave, bucket]))
  const motivosMap = new Map()
  const ultimaMarcacaoPorNegocio = new Map()

  for (const registro of historicoPerdas) {
    if (registro.negocioId === null || registro.negocioId === undefined) continue

    const marcacaoAtual = ultimaMarcacaoPorNegocio.get(registro.negocioId)
    if (!marcacaoAtual || registro.dataInteracao >= marcacaoAtual.dataInteracao) {
      ultimaMarcacaoPorNegocio.set(registro.negocioId, registro)
    }
  }

  const ultimasPerdas = [...ultimaMarcacaoPorNegocio.values()]

  for (const registro of ultimasPerdas) {
    const dataKey = getDateKeyInSaoPaulo(registro.dataInteracao)
    const chave = agrupamento === 'dia' ? dataKey : dataKey.slice(0, 7)
    const bucket = bucketByKey.get(chave)
    if (bucket) bucket.quantidade += 1

    const motivo = registro.descricao.startsWith(NEGOCIO_PERDIDO_INTERACAO_PREFIX)
      ? registro.descricao.slice(NEGOCIO_PERDIDO_INTERACAO_PREFIX.length).trim() || 'Motivo não informado'
      : 'Motivo não informado'
    motivosMap.set(motivo, (motivosMap.get(motivo) ?? 0) + 1)
  }

  const perdasPorMotivo = [...motivosMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([motivo, quantidade]) => ({
      motivo,
      quantidade,
      percentual: ultimasPerdas.length > 0
        ? Number(((quantidade / ultimasPerdas.length) * 100).toFixed(1))
        : 0,
    }))

  return {
    perdasNoPeriodo: ultimasPerdas.length,
    agrupamentoPerdas: agrupamento,
    perdasPorPeriodo: buckets.map(({ periodo, quantidade }) => ({ periodo, quantidade })),
    perdasPorMotivo,
  }
}

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

  const dataInicioPerdas = parseDateTimeInput(`${query.dataInicio.trim()}T00:00`)
  const dataFimPerdas = parseDateTimeInput(`${query.dataFim.trim()}T23:59:59`)
  dataFimPerdas?.setMilliseconds(999)

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
    dataInicioPerdas,
    dataFimPerdas,
    dataInicioStr: query.dataInicio.trim(),
    dataFimStr: query.dataFim.trim(),
    usuarioId,
    tipoMeta: normalizeTipoMeta(query.tipoMeta),
    nomeLead: query.nomeLead?.trim() || null,
    empresa: query.empresa?.trim() || null,
    cidade: query.cidade?.trim() || null,
    nicho: query.nicho?.trim() || null,
    status: ['Ativo', 'Inativo'].includes(query.status) ? query.status : null,
    visualizacaoPerdas: ['apenas_perdas', 'sem_perdas'].includes(query.visualizacaoPerdas)
      ? query.visualizacaoPerdas
      : 'tudo',
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

const buildInteracoesPerdasWhere = (filters) => ({
  tipo: 'Registro',
  descricao: { startsWith: NEGOCIO_PERDIDO_INTERACAO_PREFIX },
  dataInteracao: {
    gte: filters.dataInicioPerdas,
    lte: filters.dataFimPerdas,
  },
  negocio: {
    is: {
      ...(filters.usuarioId ? { responsaveis: { some: { id: filters.usuarioId } } } : {}),
      ...(Object.keys(buildLeadAttributeWhere(filters)).length > 0
        ? { lead: { is: buildLeadAttributeWhere(filters) } }
        : {}),
    },
  },
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

  return etapas
    .filter((etapa) => etapa.nome.trim().toLowerCase() !== 'perdida')
    .map((etapa) => ({
    etapa: etapa.nome,
    diasMedio: tempoMedioMap[etapa.nome] ?? 0,
    }))
}

export const gerarRelatorio = async (query) => {
  const filters = parseRelatorioFilters(query)
  const leadWhere = buildLeadWhere(filters)
  const negocioWhere = buildNegocioWhere(filters)

  const etapaFechado = await prisma.etapaFunil.findFirst({ where: { nome: 'Fechado' } })

  const excludedEtapaIds = [etapaFechado?.id].filter(Boolean)

  const [
    leadsNoPeriodo,
    negociosNoPeriodo,
    negociosAbertas,
    negociosFechadas,
    interacoesPerdas,
    tempoMedioPorEtapa,
    metasResult,
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
        motivoPerdaId: null,
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
    prisma.interacao.findMany({
      where: buildInteracoesPerdasWhere(filters),
      select: {
        negocioId: true,
        dataInteracao: true,
        descricao: true,
      },
      orderBy: [{ dataInteracao: 'asc' }, { id: 'asc' }],
    }),
    buildTempoMedioPorEtapa(filters, excludedEtapaIds),
    getMetasDashboardStats({
      dataInicio: filters.dataInicioStr,
      dataFim: filters.dataFimStr,
      usuarioId: filters.usuarioId || undefined,
      tipoMeta: filters.tipoMeta,
    }).catch(() => null),
  ])

  const totalNegocios = negociosNoPeriodo.length
  const taxaConversao =
    totalNegocios > 0 ? Math.round((negociosFechadas / totalNegocios) * 100) : 0

  const responsavel = await resolveResponsavelLabel(filters.usuarioId)
  const lossStats = buildLossStats(interacoesPerdas, filters)
  const visualizacaoPerdasLabels = {
    tudo: 'Tudo junto',
    apenas_perdas: 'Apenas estatísticas de perdas',
    sem_perdas: 'Sem estatísticas de perdas',
  }

  return {
    periodo: {
      dataInicio: filters.dataInicioStr,
      dataFim: filters.dataFimStr,
    },
    responsavel,
    usuarioId: filters.usuarioId,
    filtros: {
      tipoMeta: filters.tipoMeta !== 'TODOS' ? TipoMetaLabels[filters.tipoMeta] ?? null : null,
      nomeLead: filters.nomeLead,
      empresa: filters.empresa,
      cidade: filters.cidade,
      nicho: filters.nicho,
      status: filters.status,
      visualizacaoPerdas: visualizacaoPerdasLabels[filters.visualizacaoPerdas],
    },
    visualizacaoPerdas: filters.visualizacaoPerdas,
    leadsNoPeriodo,
    negociosAbertas,
    negociosCriadas: totalNegocios,
    negociosFechadas,
    oportunidadesCriadas: totalNegocios,
    oportunidadesAbertas: negociosAbertas,
    oportunidadesFechadas: negociosFechadas,
    taxaConversao,
    ...lossStats,
    tempoMedioPorEtapa,
    metas: metasResult,
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
