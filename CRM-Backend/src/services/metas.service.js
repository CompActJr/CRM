import prisma from '../lib/prisma.js'
import { parseDateTimeInput, toDateOnlyInstant } from '../utils/date.js'

const SAO_PAULO_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const toSaoPauloDateStr = (date) => SAO_PAULO_DATE_FORMATTER.format(date)

const normalizeDateStr = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10)
  }
  if (typeof value !== 'string') return null
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  return match ? match[1] : null
}

const toDateStartUtc = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`)
const toDateEndUtc = (dateStr) => new Date(`${dateStr}T23:59:59.999Z`)

const toSaoPauloDayStart = (dateStr) => parseDateTimeInput(`${dateStr}T00:00:00`)
const toSaoPauloDayEnd = (dateStr) => {
  const endSecond = parseDateTimeInput(`${dateStr}T23:59:59`)
  return endSecond ? new Date(endSecond.getTime() + 999) : null
}

const normalizeStageName = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const normalizeTipoMeta = (value) => {
  if (!value) return 'TODOS'
  const normalized = String(value).trim().toUpperCase()
  if (normalized === 'LEADS' || normalized === 'LEADS_MAPEADOS') return 'LEADS'
  if (normalized === 'ENTRADAS_CONTATO') return 'ENTRADAS_CONTATO'
  if (normalized === 'DIAGNOSTICOS') return 'DIAGNOSTICOS'
  return 'TODOS'
}

export const getPeriodBounds = (query = {}) => {
  const todayStr = toSaoPauloDateStr(new Date())
  const [year, month, day] = todayStr.split('-').map(Number)

  if (query.dataInicio || query.dataFim || query.meses === 'custom') {
    const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
    const startStr = normalizeDateStr(query.dataInicio) || firstOfMonth
    const endStr = normalizeDateStr(query.dataFim) || todayStr
    return {
      type: 'custom',
      startStr,
      endStr,
      dataInicio: toDateStartUtc(startStr),
      dataFim: toDateEndUtc(endStr),
    }
  }

  const meses = Number(query.meses)
  if (meses === 0.25) {
    const startDate = new Date(Date.UTC(year, month - 1, day - 6))
    const startStr = startDate.toISOString().slice(0, 10)
    return {
      type: 'week',
      startStr,
      endStr: todayStr,
      dataInicio: toDateStartUtc(startStr),
      dataFim: toDateEndUtc(todayStr),
    }
  }

  const numMeses = [1, 3, 6, 12].includes(meses) ? meses : 3
  const startStr = new Date(Date.UTC(year, month - 1 - (numMeses - 1), 1)).toISOString().slice(0, 10)
  const endStr = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
  return {
    type: 'months',
    numMeses,
    startStr,
    endStr,
    dataInicio: toDateStartUtc(startStr),
    dataFim: toDateEndUtc(endStr),
  }
}

const resolvePeriodoEfetivo = (filterBounds, usuario) => {
  const userStartStr = normalizeDateStr(usuario.metaPeriodoInicio)
  const userEndStr = normalizeDateStr(usuario.metaPeriodoFim)

  const startStr = userStartStr && userStartStr > filterBounds.startStr
    ? userStartStr
    : filterBounds.startStr
  const endStr = userEndStr && userEndStr < filterBounds.endStr
    ? userEndStr
    : filterBounds.endStr

  if (startStr > endStr) {
    return null
  }

  return {
    startStr,
    endStr,
    dateStartUtc: toDateStartUtc(startStr),
    dateEndUtc: toDateEndUtc(endStr),
    tsStart: toSaoPauloDayStart(startStr),
    tsEnd: toSaoPauloDayEnd(endStr),
    metaPeriodoInicio: userStartStr,
    metaPeriodoFim: userEndStr,
  }
}

const resolveEtapasMetas = async () => {
  const etapas = await prisma.etapaFunil.findMany({
    select: { id: true, nome: true, ordem: true },
    orderBy: { ordem: 'asc' },
  })

  const entradaContato =
    etapas.find((e) => normalizeStageName(e.nome) === 'entrada de contato') ||
    etapas.find((e) => {
      const normalized = normalizeStageName(e.nome)
      return normalized.includes('entrada') && normalized.includes('contato')
    }) ||
    etapas.find((e) => e.ordem === 2) ||
    null

  const diagnostico =
    etapas.find((e) => normalizeStageName(e.nome) === 'diagnostico') ||
    etapas.find((e) => normalizeStageName(e.nome).includes('diagnostico')) ||
    etapas.find((e) => e.ordem === 3) ||
    null

  return { entradaContato, diagnostico }
}

const isUsuarioResponsavelNaEntrada = (lead, usuarioId, entradaEm) => {
  if (!lead) return false

  if (lead._count?.historicoResponsaveis > 0) {
    const entradaDiaStr = toSaoPauloDateStr(entradaEm)
    const diaInicio = toSaoPauloDayStart(entradaDiaStr)
    const diaFim = toSaoPauloDayEnd(entradaDiaStr)

    return (lead.historicoResponsaveis ?? []).some((registro) => {
      const entrouAntesDoFimDoDia = registro.entradaEm <= diaFim
      const saiuDepoisDoInicioDoDia = registro.saidaEm === null || registro.saidaEm >= diaInicio
      return entrouAntesDoFimDoDia && saiuDepoisDoInicioDoDia
    })
  }

  return (
    lead.usuarioId === usuarioId ||
    (lead.responsaveis ?? []).some((responsavel) => responsavel.id === usuarioId)
  )
}

const findLeadsPorEntradaEtapa = async ({ usuarioId, etapaId, window }) => {
  if (!etapaId) return []

  const registros = await prisma.leadEtapaHistorico.findMany({
    where: {
      etapaFunilId: etapaId,
      entradaEm: {
        gte: window.tsStart,
        lte: window.tsEnd,
      },
      lead: {
        OR: [
          { historicoResponsaveis: { some: { usuarioId } } },
          { responsaveis: { some: { id: usuarioId } } },
          { usuarioId },
        ],
      },
    },
    include: {
      lead: {
        select: {
          id: true,
          nome: true,
          empresa: true,
          email: true,
          telefone: true,
          cidade: true,
          status: true,
          dataCadastro: true,
          usuarioId: true,
          etapaFunil: { select: { id: true, nome: true } },
          responsaveis: { select: { id: true } },
          _count: { select: { historicoResponsaveis: true } },
          historicoResponsaveis: {
            where: { usuarioId },
            select: {
              usuarioId: true,
              entradaEm: true,
              saidaEm: true,
            },
          },
        },
      },
    },
    orderBy: { entradaEm: 'asc' },
  })

  const leadsUnicos = new Map()
  for (const registro of registros) {
    if (!registro.lead || leadsUnicos.has(registro.leadId)) continue
    if (!isUsuarioResponsavelNaEntrada(registro.lead, usuarioId, registro.entradaEm)) continue

    leadsUnicos.set(registro.leadId, {
      id: registro.lead.id,
      titulo: registro.lead.nome,
      subtitulo: registro.lead.empresa || 'Sem empresa',
      status: registro.lead.etapaFunil?.nome || registro.lead.status,
      data: registro.entradaEm,
      detalhes: {
        email: registro.lead.email,
        telefone: registro.lead.telefone,
        cidade: registro.lead.cidade,
      },
      tipo: 'LEAD',
    })
  }

  return Array.from(leadsUnicos.values()).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}

const buildMetaCard = ({
  idPrefix,
  usuario,
  tipo,
  tipoLabel,
  unidade,
  valorAlvo,
  valorRealizado,
  window,
}) => {
  const alvo = Number(valorAlvo || 0)
  const progresso = alvo > 0
    ? Math.min(1000, Number(((valorRealizado / alvo) * 100).toFixed(1)))
    : (valorRealizado > 0 ? 100 : 0)

  const status = progresso >= 100
    ? 'ATINGIDA'
    : (valorRealizado > 0 ? 'EM_ANDAMENTO' : 'NAO_INICIADA')

  return {
    id: `${idPrefix}_${usuario.id}`,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioCargo: usuario.cargo,
    usuarioAvatar: usuario.avatarUrl,
    tipo,
    tipoLabel,
    valorAlvo: alvo,
    valorRealizado,
    unidade,
    progressoPercentual: progresso,
    status,
    periodoInicio: window.startStr,
    periodoFim: window.endStr,
    metaPeriodoInicio: window.metaPeriodoInicio,
    metaPeriodoFim: window.metaPeriodoFim,
  }
}

export const getMetasDashboardStats = async (query = {}) => {
  const filterBounds = getPeriodBounds(query)
  const usuarioId = query.usuarioId ? Number(query.usuarioId) : null
  const tipoFiltro = normalizeTipoMeta(query.tipoMeta)

  const whereUser = {
    ativo: true,
  }

  if (usuarioId) {
    whereUser.id = usuarioId
  } else {
    whereUser.OR = [
      { ativarMetaLeads: true },
      { ativarMetaEntradasContato: true },
      { ativarMetaDiagnosticos: true },
    ]
  }

  const [usuarios, etapas] = await Promise.all([
    prisma.usuario.findMany({
      where: whereUser,
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        avatarUrl: true,
        ativarMetaLeads: true,
        ativarMetaEntradasContato: true,
        ativarMetaDiagnosticos: true,
        quantidadeLeads: true,
        quantidadeEntradasContato: true,
        quantidadeDiagnosticos: true,
        metaPeriodoInicio: true,
        metaPeriodoFim: true,
      },
      orderBy: { nome: 'asc' },
    }),
    resolveEtapasMetas(),
  ])

  const metasCards = []
  const rankingMap = new Map()

  for (const usuario of usuarios) {
    const window = resolvePeriodoEfetivo(filterBounds, usuario)
    if (!window) continue

    let userScoreTotal = 0
    let userMetasCount = 0

    // 1. Meta de Leads Mapeados
    if (usuario.ativarMetaLeads && (tipoFiltro === 'TODOS' || tipoFiltro === 'LEADS')) {
      const totalLeadsMapeados = await prisma.lead.count({
        where: {
          usuarioId: usuario.id,
          dataCadastro: {
            gte: window.dateStartUtc,
            lte: window.dateEndUtc,
          },
        },
      })

      const card = buildMetaCard({
        idPrefix: 'lead',
        usuario,
        tipo: 'LEADS',
        tipoLabel: 'Leads Mapeados',
        unidade: 'leads',
        valorAlvo: usuario.quantidadeLeads,
        valorRealizado: totalLeadsMapeados,
        window,
      })

      metasCards.push(card)
      userScoreTotal += card.progressoPercentual
      userMetasCount++
    }

    // 2. Meta de Entradas de Contato
    if (
      usuario.ativarMetaEntradasContato &&
      (tipoFiltro === 'TODOS' || tipoFiltro === 'ENTRADAS_CONTATO')
    ) {
      const entradasContato = await findLeadsPorEntradaEtapa({
        usuarioId: usuario.id,
        etapaId: etapas.entradaContato?.id,
        window,
      })

      const card = buildMetaCard({
        idPrefix: 'entrada_contato',
        usuario,
        tipo: 'ENTRADAS_CONTATO',
        tipoLabel: 'Entradas de Contato',
        unidade: 'leads',
        valorAlvo: usuario.quantidadeEntradasContato,
        valorRealizado: entradasContato.length,
        window,
      })

      metasCards.push(card)
      userScoreTotal += card.progressoPercentual
      userMetasCount++
    }

    // 3. Meta de Diagnósticos Marcados
    if (
      usuario.ativarMetaDiagnosticos &&
      (tipoFiltro === 'TODOS' || tipoFiltro === 'DIAGNOSTICOS')
    ) {
      const diagnosticos = await findLeadsPorEntradaEtapa({
        usuarioId: usuario.id,
        etapaId: etapas.diagnostico?.id,
        window,
      })

      const card = buildMetaCard({
        idPrefix: 'diagnostico',
        usuario,
        tipo: 'DIAGNOSTICOS',
        tipoLabel: 'Diagnósticos Marcados',
        unidade: 'diagnósticos',
        valorAlvo: usuario.quantidadeDiagnosticos,
        valorRealizado: diagnosticos.length,
        window,
      })

      metasCards.push(card)
      userScoreTotal += card.progressoPercentual
      userMetasCount++
    }

    if (userMetasCount > 0) {
      rankingMap.set(usuario.id, {
        usuarioId: usuario.id,
        nome: usuario.nome,
        cargo: usuario.cargo,
        avatarUrl: usuario.avatarUrl,
        mediaProgresso: Number((userScoreTotal / userMetasCount).toFixed(1)),
        totalMetasAtivas: userMetasCount,
      })
    }
  }

  const ranking = Array.from(rankingMap.values())
    .sort((a, b) => b.mediaProgresso - a.mediaProgresso)
    .map((item, index) => ({
      posicao: index + 1,
      ...item,
    }))

  const totalMetas = metasCards.length
  const metasAtingidas = metasCards.filter((m) => m.progressoPercentual >= 100).length
  const metasEmAndamento = metasCards.filter((m) => m.progressoPercentual > 0 && m.progressoPercentual < 100).length
  const metasNaoIniciadas = metasCards.filter((m) => m.progressoPercentual === 0).length

  const percentualMetasAtingidas = totalMetas > 0
    ? Number(((metasAtingidas / totalMetas) * 100).toFixed(1))
    : 0

  return {
    periodo: {
      dataInicio: filterBounds.startStr,
      dataFim: filterBounds.endStr,
    },
    kpis: {
      totalMetas,
      metasAtingidas,
      metasEmAndamento,
      metasNaoIniciadas,
      percentualMetasAtingidas,
    },
    metas: metasCards,
    ranking,
  }
}

export const getMetasContribuicoes = async ({ usuarioId, tipoMeta, meses, dataInicio, dataFim }) => {
  if (!usuarioId) {
    const error = new Error('ID do usuário é obrigatório para consultar contribuições.')
    error.statusCode = 400
    throw error
  }

  const filterBounds = getPeriodBounds({ meses, dataInicio, dataFim })
  const normalizedTipo = normalizeTipoMeta(tipoMeta)

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(usuarioId) },
    select: {
      id: true,
      nome: true,
      cargo: true,
      avatarUrl: true,
      metaPeriodoInicio: true,
      metaPeriodoFim: true,
    },
  })

  if (!usuario) {
    const error = new Error('Usuário não encontrado.')
    error.statusCode = 404
    throw error
  }

  const window = resolvePeriodoEfetivo(filterBounds, usuario)
  if (!window) {
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        cargo: usuario.cargo,
        avatarUrl: usuario.avatarUrl,
      },
      tipoMeta: normalizedTipo,
      periodo: {
        dataInicio: filterBounds.startStr,
        dataFim: filterBounds.endStr,
      },
      totalContribuicoes: 0,
      contribuicoes: [],
    }
  }

  let contribuicoes = []

  if (normalizedTipo === 'LEADS') {
    const leads = await prisma.lead.findMany({
      where: {
        usuarioId: usuario.id,
        dataCadastro: {
          gte: window.dateStartUtc,
          lte: window.dateEndUtc,
        },
      },
      select: {
        id: true,
        nome: true,
        empresa: true,
        email: true,
        telefone: true,
        cidade: true,
        status: true,
        dataCadastro: true,
        etapaFunil: { select: { nome: true } },
      },
      orderBy: { dataCadastro: 'desc' },
    })

    contribuicoes = leads.map((l) => ({
      id: l.id,
      titulo: l.nome,
      subtitulo: l.empresa || 'Sem empresa',
      status: l.etapaFunil?.nome || l.status,
      data: toDateOnlyInstant(l.dataCadastro),
      detalhes: {
        email: l.email,
        telefone: l.telefone,
        cidade: l.cidade,
      },
      tipo: 'LEAD',
    }))
  } else if (normalizedTipo === 'ENTRADAS_CONTATO' || normalizedTipo === 'DIAGNOSTICOS') {
    const etapas = await resolveEtapasMetas()
    const etapaId = normalizedTipo === 'ENTRADAS_CONTATO'
      ? etapas.entradaContato?.id
      : etapas.diagnostico?.id

    contribuicoes = await findLeadsPorEntradaEtapa({
      usuarioId: usuario.id,
      etapaId,
      window,
    })
  }

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      cargo: usuario.cargo,
      avatarUrl: usuario.avatarUrl,
    },
    tipoMeta: normalizedTipo,
    periodo: {
      dataInicio: window.startStr,
      dataFim: window.endStr,
    },
    totalContribuicoes: contribuicoes.length,
    contribuicoes,
  }
}
