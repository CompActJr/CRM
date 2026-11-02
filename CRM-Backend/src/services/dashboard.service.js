import prisma from '../lib/prisma.js'
import { formatCurrencyBr } from '../utils/currency.js'
import {
  buildEtapaEvento,
  buildInteracaoEvento,
  buildResponsavelEventos,
  buildTarefaEventos,
  timelineEtapaInclude,
  timelineInteracaoInclude,
  timelineLeadResponsavelInclude,
  timelineNegocioResponsavelInclude,
  timelineTarefaInclude,
} from '../utils/timelineMapper.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const NEGOCIO_EXCLUIDO_PREFIX = '__CRM_NEGOCIO_EXCLUIDO__'
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const parseDateInput = (value, isEnd = false) => {
  if (!value || typeof value !== 'string') return null
  const dateStr = isEnd ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`
  const parsed = new Date(dateStr)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getPeriodBounds = (query) => {
  const now = new Date()

  if (query.meses === 'custom' || query.dataInicio || query.dataFim) {
    const dataInicio = parseDateInput(query.dataInicio) || new Date(now.getFullYear(), now.getMonth(), 1)
    const dataFim = parseDateInput(query.dataFim, true) || new Date(now)
    return { type: 'custom', dataInicio, dataFim }
  }

  const meses = Number(query.meses)
  if (meses === 0.25) {
    const dataInicio = new Date(now)
    dataInicio.setDate(now.getDate() - 6)
    dataInicio.setHours(0, 0, 0, 0)
    const dataFim = new Date(now)
    dataFim.setHours(23, 59, 59, 999)
    return { type: 'week', dataInicio, dataFim }
  }

  const numMeses = [3, 6, 12].includes(meses) ? meses : 6
  const dataInicio = new Date(now.getFullYear(), now.getMonth() - (numMeses - 1), 1)
  const dataFim = new Date(now)
  dataFim.setHours(23, 59, 59, 999)
  return { type: 'months', numMeses, dataInicio, dataFim }
}

export const getDashboardStats = async (query = {}) => {
  const periodInfo = getPeriodBounds(query)
  const { dataInicio, dataFim } = periodInfo

  const leadWhere = {
    dataCadastro: { gte: dataInicio, lte: dataFim },
  }

  const negocioWhere = {
    dataCriacao: { gte: dataInicio, lte: dataFim },
  }

  const etapaFechado = await prisma.etapaFunil.findFirst({ where: { nome: 'Fechado' } })

  const [
    totalLeads,
    leadsAtivos,
    totalNegocios,
    negociosFechadas,
    leads,
    negociosAbertas,
    emNegociacao,
    negociosEmAndamento,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: 'Ativo' } }),
    prisma.negocio.count({ where: negocioWhere }),
    prisma.negocio.findMany({
      where: {
        ...negocioWhere,
        etapaFunil: { nome: 'Fechado' },
      },
      select: { valorEstimado: true },
    }),
    prisma.lead.findMany({
      where: leadWhere,
      select: { dataCadastro: true, status: true },
      orderBy: { dataCadastro: 'desc' },
    }),
    etapaFechado
      ? prisma.negocio.count({
        where: {
          ...negocioWhere,
          etapaFunilId: { not: etapaFechado.id },
        },
      })
      : prisma.negocio.count({ where: negocioWhere }),
    prisma.negocio.count({
      where: {
        ...negocioWhere,
        etapaFunil: { nome: 'Negociação' },
      },
    }),
    etapaFechado
      ? prisma.negocio.findMany({
        where: {
          ...negocioWhere,
          etapaFunilId: { not: etapaFechado.id },
        },
        select: { valorEstimado: true },
      })
      : prisma.negocio.findMany({
        where: negocioWhere,
        select: { valorEstimado: true },
      }),
  ])

  const leadsInativos = totalLeads - leadsAtivos
  const ativosPercentual = totalLeads > 0 ? Math.round((leadsAtivos / totalLeads) * 100) : 0
  const passivosPercentual = totalLeads > 0 ? 100 - ativosPercentual : 0

  const valorVendasFechadas = negociosFechadas.reduce(
    (acc, item) => acc + Number(item.valorEstimado || 0),
    0
  )

  const valorEmAndamento = negociosEmAndamento.reduce(
    (acc, item) => acc + Number(item.valorEstimado || 0),
    0
  )

  const taxaConversao =
    totalNegocios > 0
      ? Math.round((negociosFechadas.length / totalNegocios) * 100)
      : 0

  const leadsPorMes = buildLeadsChartData(leads, periodInfo)

  const responseMeses = periodInfo.type === 'custom'
    ? 'custom'
    : periodInfo.type === 'week'
      ? 0.25
      : periodInfo.numMeses

  return {
    meses: responseMeses,
    totalLeads,
    leadsAtivos,
    leadsInativos,
    ativosPercentual,
    passivosPercentual,
    negociosAbertas,
    emNegociacao,
    taxaConversao,
    vendasFechadas: {
      quantidade: negociosFechadas.length,
      valor: formatCurrencyBr(valorVendasFechadas),
    },
    negociosEmAndamento: {
      quantidade: negociosEmAndamento.length,
      valor: formatCurrencyBr(valorEmAndamento),
    },
    leadsPorMes,
  }
}

export const getDashboardAtividades = async (usuarioIdParam) => {
  const usuarioId = Number(usuarioIdParam)
  if (!Number.isInteger(usuarioId) || usuarioId < 1) {
    const error = new Error('Usuário inválido.')
    error.statusCode = 400
    throw error
  }

  const [leads, negocios] = await Promise.all([
    prisma.lead.findMany({ where: { usuarioId }, select: { id: true, nome: true } }),
    prisma.negocio.findMany({
      where: { responsaveis: { some: { id: usuarioId } } },
      select: {
        id: true,
        titulo: true,
        leadId: true,
        dataCriacao: true,
        etapaFunil: { select: { nome: true } },
        lead: { select: { nome: true } },
      },
    }),
  ])

  const leadNames = new Map(leads.map((lead) => [lead.id, lead.nome]))
  const negocioMap = new Map(negocios.map((negocio) => [negocio.id, negocio]))
  const leadIds = leads.map((lead) => lead.id)
  const negocioIds = negocios.map((negocio) => negocio.id)
  const cutoff = Date.now() - 30 * MS_PER_DAY
  const cutoffDate = new Date(cutoff)
  const [etapas, tarefas, interacoes, historicoLead, historicoNegocio, exclusoesNegocio] = await Promise.all([
    negocioIds.length ? prisma.negocioEtapaHistorico.findMany({
      where: { negocioId: { in: negocioIds }, entradaEm: { gte: new Date(cutoff - 7 * MS_PER_DAY) } },
      include: timelineEtapaInclude,
    }) : [],
    leadIds.length || negocioIds.length ? prisma.tarefa.findMany({
      where: {
        OR: [
          ...(leadIds.length ? [{ leadId: { in: leadIds }, negocioId: null, createdAt: { gte: cutoffDate } }] : []),
          ...(negocioIds.length ? [{ negocioId: { in: negocioIds }, createdAt: { gte: cutoffDate } }] : []),
          { negocioId: { in: negocioIds }, status: 'Concluida', updatedAt: { gte: cutoffDate } },
        ],
      },
      include: timelineTarefaInclude,
    }) : [],
    leadIds.length ? prisma.interacao.findMany({
      where: {
        leadId: { in: leadIds },
        tipo: 'Nota',
        dataInteracao: { gte: cutoffDate },
        OR: [
          { negocioId: null },
          ...(negocioIds.length ? [{ negocioId: { in: negocioIds } }] : []),
        ],
      },
      include: timelineInteracaoInclude,
    }) : [],
    leadIds.length ? prisma.leadResponsavelHistorico.findMany({
      where: { leadId: { in: leadIds }, OR: [{ entradaEm: { gte: cutoffDate } }, { saidaEm: { gte: cutoffDate } }] },
      include: timelineLeadResponsavelInclude,
    }) : [],
    negocioIds.length ? prisma.negocioResponsavelHistorico.findMany({
      where: { negocioId: { in: negocioIds }, OR: [{ entradaEm: { gte: cutoffDate } }, { saidaEm: { gte: cutoffDate } }] },
      include: timelineNegocioResponsavelInclude,
    }) : [],
    prisma.interacao.findMany({
      where: {
        tipo: 'Registro',
        dataInteracao: { gte: cutoffDate },
        descricao: { startsWith: NEGOCIO_EXCLUIDO_PREFIX },
      },
    }),
  ])

  const dadosExclusao = exclusoesNegocio.flatMap((registro) => {
    try {
      return [{ registro, detalhes: JSON.parse(registro.descricao.slice(NEGOCIO_EXCLUIDO_PREFIX.length)) }]
    } catch {
      return []
    }
  })
  const dadosExclusaoVisiveis = dadosExclusao.filter(({ detalhes }) =>
    (detalhes.responsavelIds ?? []).includes(usuarioId)
  )
  const tarefasExcluidas = new Set(dadosExclusaoVisiveis.flatMap(({ detalhes }) => detalhes.tarefaIds ?? []))
  const interacoesExcluidas = new Set(dadosExclusaoVisiveis.flatMap(({ detalhes }) => detalhes.interacaoIds ?? []))

  const criacoesNegocio = negocios
    .filter((negocio) => negocio.dataCriacao.getTime() >= cutoff && negocio.dataCriacao.getTime() <= Date.now())
    .map((negocio) => {
      const responsaveisIniciais = historicoNegocio
        .filter((registro) => registro.negocioId === negocio.id && registro.entradaEm.getTime() === negocio.dataCriacao.getTime())
        .map((registro) => registro.usuario?.nome)
        .filter(Boolean)
      return {
        id: `negocio-${negocio.id}-criado`,
        tipo: 'negocio',
        tipoLabel: 'Negócio',
        evento: 'Negócio criado',
        descricao: negocio.titulo,
        detalhe: `Responsável: ${responsaveisIniciais.join(', ') || 'Não informado'} · Etapa: ${negocio.etapaFunil.nome}`,
        data: negocio.dataCriacao.toISOString(),
        negocioId: negocio.id,
        negocioTitulo: negocio.titulo,
        leadId: negocio.leadId,
        leadNome: negocio.lead.nome,
      }
    })

  const atividades = [
    ...dadosExclusaoVisiveis.map(({ registro, detalhes }) => ({
      id: `negocio-${detalhes.negocioId}-excluido-${registro.id}`,
      tipo: 'negocio',
      tipoLabel: 'Negócio',
      evento: 'Negócio excluído',
      descricao: detalhes.titulo,
      detalhe: null,
      data: registro.dataInteracao.toISOString(),
      negocioId: null,
      negocioTitulo: detalhes.titulo,
      leadId: registro.leadId,
      leadNome: detalhes.leadNome ?? leadNames.get(registro.leadId),
    })),
    ...criacoesNegocio,
    ...etapas
      .filter((registro) => registro.entradaEm.getTime() !== negocioMap.get(registro.negocioId)?.dataCriacao.getTime())
      .map((registro) => ({
        ...buildEtapaEvento(registro),
        evento: `Etapa alterada para ${registro.etapaFunil.nome}`,
        detalhe: null,
        leadId: negocioMap.get(registro.negocioId)?.leadId,
      })),
    ...tarefas
      .filter((tarefa) => !tarefasExcluidas.has(tarefa.id))
      .flatMap((tarefa) => buildTarefaEventos(tarefa).map((evento) => ({ ...evento, leadId: tarefa.leadId }))),
    ...interacoes
      .filter((interacao) => !interacoesExcluidas.has(interacao.id) && (!interacao.negocioId || negocioMap.has(interacao.negocioId)))
      .map((interacao) => ({ ...buildInteracaoEvento(interacao), leadId: interacao.leadId })),
    ...historicoLead.flatMap((registro) => buildResponsavelEventos(registro, 'lead').map((evento) => ({ ...evento, leadId: registro.leadId }))),
    ...historicoNegocio
      .filter((registro) => registro.entradaEm.getTime() !== negocioMap.get(registro.negocioId)?.dataCriacao.getTime())
      .flatMap((registro) => buildResponsavelEventos(registro, 'negocio').map((evento) => ({
        ...evento,
        leadId: negocioMap.get(registro.negocioId)?.leadId,
      }))),
  ].filter((evento) => {
    const timestamp = new Date(evento.data).getTime()
    return timestamp >= cutoff && timestamp <= Date.now()
  }).map((evento) => ({
    ...evento,
    leadNome: negocioMap.get(evento.negocioId)?.lead.nome ?? leadNames.get(evento.leadId),
  }))

  return atividades.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 20)
}

const buildLeadsChartData = (leads, periodInfo) => {
  if (periodInfo.type === 'week') {
    const buckets = []
    const start = new Date(periodInfo.dataInicio)
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      buckets.push({
        key,
        label: dayNames[d.getDay()],
        count: 0,
      })
    }

    for (const lead of leads) {
      const reg = new Date(lead.dataCadastro)
      const key = `${reg.getFullYear()}-${reg.getMonth()}-${reg.getDate()}`
      const bucket = buckets.find((b) => b.key === key)
      if (bucket) bucket.count += 1
    }

    const maxCount = Math.max(...buckets.map((b) => b.count), 0)
    return buckets.map((b) => ({
      label: b.label,
      count: b.count,
      height: b.count === 0 || maxCount === 0 ? 0 : Math.max(18, Math.round((b.count / maxCount) * 100)),
    }))
  }

  if (periodInfo.type === 'custom') {
    const bucketsMap = {}
    for (const lead of leads) {
      const reg = new Date(lead.dataCadastro)
      const label = `${reg.getDate()}/${reg.getMonth() + 1}`
      bucketsMap[label] = (bucketsMap[label] || 0) + 1
    }

    const labels = Object.keys(bucketsMap)
    if (labels.length === 0) {
      return [{ label: 'Sem registros', count: 0, height: 0 }]
    }

    const maxCount = Math.max(...Object.values(bucketsMap), 0)
    return labels.map((label) => ({
      label,
      count: bucketsMap[label],
      height: bucketsMap[label] === 0 || maxCount === 0 ? 0 : Math.max(18, Math.round((bucketsMap[label] / maxCount) * 100)),
    }))
  }

  // numMeses: 3, 6, 12
  const now = new Date()
  const buckets = []
  const numMeses = periodInfo.numMeses || 6

  for (let index = numMeses - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthNames[date.getMonth()],
      count: 0,
    })
  }

  for (const lead of leads) {
    const registered = new Date(lead.dataCadastro)
    const key = `${registered.getFullYear()}-${registered.getMonth()}`
    const bucket = buckets.find((item) => item.key === key)
    if (bucket) bucket.count += 1
  }

  const maxCount = Math.max(...buckets.map((item) => item.count), 0)

  return buckets.map((item) => ({
    label: item.label,
    count: item.count,
    height: item.count === 0 || maxCount === 0 ? 0 : Math.max(18, Math.round((item.count / maxCount) * 100)),
  }))
}

