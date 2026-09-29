import prisma from '../lib/prisma.js'
import { formatCurrencyBr } from '../utils/currency.js'

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

  const oportunidadeWhere = {
    dataCriacao: { gte: dataInicio, lte: dataFim },
  }

  const etapaFechado = await prisma.etapaFunil.findFirst({ where: { nome: 'Fechado' } })

  const [
    totalLeads,
    leadsAtivos,
    totalOportunidades,
    oportunidadesFechadas,
    leads,
    oportunidadesAbertas,
    emNegociacao,
    oportunidadesEmAndamento,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: 'Ativo' } }),
    prisma.oportunidade.count({ where: oportunidadeWhere }),
    prisma.oportunidade.findMany({
      where: {
        ...oportunidadeWhere,
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
      ? prisma.oportunidade.count({
          where: {
            ...oportunidadeWhere,
            etapaFunilId: { not: etapaFechado.id },
          },
        })
      : prisma.oportunidade.count({ where: oportunidadeWhere }),
    prisma.oportunidade.count({
      where: {
        ...oportunidadeWhere,
        etapaFunil: { nome: 'Negociação' },
      },
    }),
    etapaFechado
      ? prisma.oportunidade.findMany({
          where: {
            ...oportunidadeWhere,
            etapaFunilId: { not: etapaFechado.id },
          },
          select: { valorEstimado: true },
        })
      : prisma.oportunidade.findMany({
          where: oportunidadeWhere,
          select: { valorEstimado: true },
        }),
  ])

  const leadsInativos = totalLeads - leadsAtivos
  const ativosPercentual = totalLeads > 0 ? Math.round((leadsAtivos / totalLeads) * 100) : 0
  const passivosPercentual = totalLeads > 0 ? 100 - ativosPercentual : 0

  const valorVendasFechadas = oportunidadesFechadas.reduce(
    (acc, item) => acc + Number(item.valorEstimado || 0),
    0
  )

  const valorEmAndamento = oportunidadesEmAndamento.reduce(
    (acc, item) => acc + Number(item.valorEstimado || 0),
    0
  )

  const taxaConversao =
    totalOportunidades > 0
      ? Math.round((oportunidadesFechadas.length / totalOportunidades) * 100)
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
    oportunidadesAbertas,
    emNegociacao,
    taxaConversao,
    vendasFechadas: {
      quantidade: oportunidadesFechadas.length,
      valor: formatCurrencyBr(valorVendasFechadas),
    },
    negociosEmAndamento: {
      quantidade: oportunidadesEmAndamento.length,
      valor: formatCurrencyBr(valorEmAndamento),
    },
    leadsPorMes,
  }
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

