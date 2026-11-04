import prisma from '../lib/prisma.js'

const parseDateInput = (value, isEnd = false) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value !== 'string') return null
  const dateStr = isEnd ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`
  const parsed = new Date(dateStr)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const getPeriodBounds = (query = {}) => {
  const now = new Date()

  if (query.dataInicio || query.dataFim || query.meses === 'custom') {
    const dataInicio = parseDateInput(query.dataInicio) || new Date(now.getFullYear(), now.getMonth(), 1)
    const dataFim = parseDateInput(query.dataFim, true) || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
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

  const numMeses = [1, 3, 6, 12].includes(meses) ? meses : 3
  const dataInicio = new Date(now.getFullYear(), now.getMonth() - (numMeses - 1), 1)
  const dataFim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { type: 'months', numMeses, dataInicio, dataFim }
}

export const getMetasDashboardStats = async (query = {}) => {
  const { dataInicio, dataFim } = getPeriodBounds(query)
  const usuarioId = query.usuarioId ? Number(query.usuarioId) : null
  const tipoFiltro = query.tipoMeta || 'todos' // 'todos' | 'leads' | 'negociacoes'

  // Buscar usuários com metas configuradas e ativas
  const whereUser = {
    ativo: true,
  }

  if (usuarioId) {
    whereUser.id = usuarioId
  } else {
    whereUser.OR = [
      { ativarMetaLeads: true },
      { ativarMetasNegociacoes: true },
    ]
  }

  const usuarios = await prisma.usuario.findMany({
    where: whereUser,
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
      avatarUrl: true,
      ativarMetaLeads: true,
      ativarMetasNegociacoes: true,
      quantidadeLeads: true,
      quantidadeNegociacoes: true,
      metaPeriodoInicio: true,
      metaPeriodoFim: true,
    },
    orderBy: { nome: 'asc' },
  })

  const metasCards = []
  const rankingMap = new Map()

  for (const usuario of usuarios) {
    // Determinar janela de período para este usuário:
    // Se o filtro veio com datas personalizadas, usamos o filtro global;
    // Caso contrário, se o usuário tem período configurado, usamos o dele, ou fallback para o bounds global.
    const userPeriodoInicio = query.dataInicio && query.dataFim
      ? dataInicio
      : (usuario.metaPeriodoInicio || dataInicio)
    const userPeriodoFim = query.dataInicio && query.dataFim
      ? dataFim
      : (usuario.metaPeriodoFim ? new Date(`${usuario.metaPeriodoFim.toISOString().split('T')[0]}T23:59:59.999Z`) : dataFim)

    let userScoreTotal = 0
    let userMetasCount = 0

    // 1. Meta de Leads
    if (usuario.ativarMetaLeads && (tipoFiltro === 'todos' || tipoFiltro === 'leads')) {
      const totalLeadsCadastrados = await prisma.lead.count({
        where: {
          usuarioId: usuario.id,
          dataCadastro: {
            gte: userPeriodoInicio,
            lte: userPeriodoFim,
          },
        },
      })

      const alvoLeads = Number(usuario.quantidadeLeads || 0)
      const progressoLeads = alvoLeads > 0
        ? Math.min(1000, Number(((totalLeadsCadastrados / alvoLeads) * 100).toFixed(1)))
        : (totalLeadsCadastrados > 0 ? 100 : 0)

      const statusMeta = progressoLeads >= 100
        ? 'ATINGIDA'
        : (totalLeadsCadastrados > 0 ? 'EM_ANDAMENTO' : 'NAO_INICIADA')

      metasCards.push({
        id: `lead_${usuario.id}`,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioCargo: usuario.cargo,
        usuarioAvatar: usuario.avatarUrl,
        tipo: 'LEADS',
        tipoLabel: 'Leads Cadastrados',
        valorAlvo: alvoLeads,
        valorRealizado: totalLeadsCadastrados,
        unidade: 'leads',
        progressoPercentual: progressoLeads,
        status: statusMeta,
        periodoInicio: userPeriodoInicio,
        periodoFim: userPeriodoFim,
      })

      userScoreTotal += progressoLeads
      userMetasCount++
    }

    // 2. Meta de Negociações (via negocio_responsavel_historico)
    if (usuario.ativarMetasNegociacoes && (tipoFiltro === 'todos' || tipoFiltro === 'negociacoes')) {
      const historicosNegocios = await prisma.negocioResponsavelHistorico.findMany({
        where: {
          usuarioId: usuario.id,
          entradaEm: { lte: userPeriodoFim },
          OR: [
            { saidaEm: null },
            { saidaEm: { gte: userPeriodoInicio } },
          ],
          negocio: {
            dataCriacao: {
              gte: userPeriodoInicio,
              lte: userPeriodoFim,
            },
          },
        },
        include: {
          negocio: {
            select: {
              id: true,
              valorEstimado: true,
            },
          },
        },
      })

      // Extrai negócios únicos para evitar contagem duplicada se houve múltiplas passagens
      const negociosUnicosMap = new Map()
      for (const h of historicosNegocios) {
        if (h.negocio && !negociosUnicosMap.has(h.negocio.id)) {
          negociosUnicosMap.set(h.negocio.id, Number(h.negocio.valorEstimado || 0))
        }
      }

      const totalNegociosCount = negociosUnicosMap.size
      let totalValorEstimado = 0
      for (const valor of negociosUnicosMap.values()) {
        totalValorEstimado += valor
      }

      const alvoNegociacoes = Number(usuario.quantidadeNegociacoes || 0)
      const progressoNegociacoes = alvoNegociacoes > 0
        ? Math.min(1000, Number(((totalNegociosCount / alvoNegociacoes) * 100).toFixed(1)))
        : (totalNegociosCount > 0 ? 100 : 0)

      const statusMeta = progressoNegociacoes >= 100
        ? 'ATINGIDA'
        : (totalNegociosCount > 0 ? 'EM_ANDAMENTO' : 'NAO_INICIADA')

      metasCards.push({
        id: `negocio_${usuario.id}`,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioCargo: usuario.cargo,
        usuarioAvatar: usuario.avatarUrl,
        tipo: 'NEGOCIACOES',
        tipoLabel: 'Negociações Atribuídas',
        valorAlvo: alvoNegociacoes,
        valorRealizado: totalNegociosCount,
        valorTotalEstimado,
        unidade: 'negócios',
        progressoPercentual: progressoNegociacoes,
        status: statusMeta,
        periodoInicio: userPeriodoInicio,
        periodoFim: userPeriodoFim,
      })

      userScoreTotal += progressoNegociacoes
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

  // Ordenar ranking por maior média de progresso
  const ranking = Array.from(rankingMap.values()).sort(
    (a, b) => b.mediaProgresso - a.mediaProgresso
  ).map((item, index) => ({
    posicao: index + 1,
    ...item,
  }))

  // Resumo Geral (KPIs)
  const totalMetas = metasCards.length
  const metasAtingidas = metasCards.filter((m) => m.progressoPercentual >= 100).length
  const metasEmAndamento = metasCards.filter((m) => m.progressoPercentual > 0 && m.progressoPercentual < 100).length
  const metasNaoIniciadas = metasCards.filter((m) => m.progressoPercentual === 0).length

  const percentualMetasAtingidas = totalMetas > 0
    ? Number(((metasAtingidas / totalMetas) * 100).toFixed(1))
    : 0

  return {
    periodo: {
      dataInicio,
      dataFim,
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

export const getMetasContribuicoes = async ({ usuarioId, tipoMeta, dataInicio, dataFim }) => {
  if (!usuarioId) {
    const error = new Error('ID do usuário é obrigatório para consultar contribuições.')
    error.statusCode = 400
    throw error
  }

  const bounds = getPeriodBounds({ dataInicio, dataFim })
  const inicio = bounds.dataInicio
  const fim = bounds.dataFim

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

  // Se não foi informada data na query e o usuário tiver período salvo, usa o dele
  const periodoInicio = dataInicio ? inicio : (usuario.metaPeriodoInicio || inicio)
  const periodoFim = dataFim ? fim : (usuario.metaPeriodoFim ? new Date(`${usuario.metaPeriodoFim.toISOString().split('T')[0]}T23:59:59.999Z`) : fim)

  let contribuicoes = []

  if (tipoMeta === 'LEADS' || tipoMeta === 'leads') {
    const leads = await prisma.lead.findMany({
      where: {
        usuarioId: usuario.id,
        dataCadastro: {
          gte: periodoInicio,
          lte: periodoFim,
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
        createdAt: true,
      },
      orderBy: { dataCadastro: 'desc' },
    })

    contribuicoes = leads.map((l) => ({
      id: l.id,
      titulo: l.nome,
      subtitulo: l.empresa || 'Sem empresa',
      status: l.status,
      data: l.dataCadastro,
      detalhes: {
        email: l.email,
        telefone: l.telefone,
        cidade: l.cidade,
      },
      tipo: 'LEAD',
    }))
  } else {
    // Negócios via histórico de responsabilidade
    const historicos = await prisma.negocioResponsavelHistorico.findMany({
      where: {
        usuarioId: usuario.id,
        entradaEm: { lte: periodoFim },
        OR: [
          { saidaEm: null },
          { saidaEm: { gte: periodoInicio } },
        ],
        negocio: {
          dataCriacao: {
            gte: periodoInicio,
            lte: periodoFim,
          },
        },
      },
      include: {
        negocio: {
          include: {
            etapaFunil: {
              select: {
                id: true,
                nome: true,
              },
            },
            lead: {
              select: {
                id: true,
                nome: true,
                empresa: true,
              },
            },
          },
        },
      },
      orderBy: {
        negocio: {
          dataCriacao: 'desc',
        },
      },
    })

    const vistos = new Set()
    for (const h of historicos) {
      if (h.negocio && !vistos.has(h.negocio.id)) {
        vistos.add(h.negocio.id)
        contribuicoes.push({
          id: h.negocio.id,
          titulo: h.negocio.titulo,
          subtitulo: h.negocio.lead?.nome ? `${h.negocio.lead.nome} (${h.negocio.lead.empresa || 'Empresa não informada'})` : 'Sem lead associado',
          status: h.negocio.etapaFunil?.nome || 'Etapa não definida',
          valorEstimado: Number(h.negocio.valorEstimado || 0),
          data: h.negocio.dataCriacao,
          entradaEm: h.entradaEm,
          saidaEm: h.saidaEm,
          tipo: 'NEGOCIO',
        })
      }
    }
  }

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      cargo: usuario.cargo,
      avatarUrl: usuario.avatarUrl,
    },
    tipoMeta: tipoMeta.toUpperCase(),
    periodo: {
      dataInicio: periodoInicio,
      dataFim: periodoFim,
    },
    totalContribuicoes: contribuicoes.length,
    contribuicoes,
  }
}

