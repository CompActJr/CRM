import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { TransactionOptions } from '../lib/transaction.js'
import { parseValorEstimado } from '../utils/currency.js'
import { mapNegocioToResponse, negocioInclude } from '../utils/negocioMapper.js'
import { parseUsuarioIdFilter } from '../utils/usuarioFilter.js'
import {
  calcularTempoMedioPorEtapa,
  registrarEntradaEtapa,
  registrarMudancaEtapa,
} from './negocioEtapaHistorico.service.js'
import {
  registrarResponsaveisNegocio,
  sincronizarResponsaveisNegocio,
} from './responsavelHistorico.service.js'
import {
  buildTarefaResumo,
  collectLeadPendingDates,
  collectNegocioPendingDates,
  sortByPendingTasks,
} from '../utils/tarefaResumo.js'
import { formatDateBr } from '../utils/date.js'
import {normalizeString} from "../utils/stringNormalize.js";
import {parseTemperaturaRange} from "../utils/temperatura.js";

const parseNegocioId = (id) => {
  const parsed = Number(id)
  if (!id || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const parseRelationId = (value) => {
  const parsed = Number(value)
  if (!value || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const parseRelationIds = (value) => {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  const parsed = list
    .map((item) => Number(item))
    .filter((id) => !Number.isNaN(id) && id > 0)
  return [...new Set(parsed)]
}

const buildNegocioData = async (body) => {
  const titulo = body.titulo?.trim()
  if (!titulo) {
    const error = new Error(ErrorMessages.tituloRequired)
    error.statusCode = 400
    throw error
  }

  const valorEstimado = parseValorEstimado(body.valorEstimado)
  if (valorEstimado === null) {
    const error = new Error(ErrorMessages.invalidValorEstimado)
    error.statusCode = 400
    throw error
  }

  const responsaveisIds = parseRelationIds(body.responsaveisIds ?? body.usuarioIds ?? body.usuarioId)
  if (responsaveisIds.length === 0) {
    const error = new Error(ErrorMessages.responsaveisRequired)
    error.statusCode = 400
    throw error
  }

  const leadId = parseRelationId(body.leadId)
  if (!leadId) {
    const error = new Error(ErrorMessages.invalidLeadIdRef)
    error.statusCode = 400
    throw error
  }

  const etapaFunilId = parseRelationId(body.etapaFunilId)
  if (!etapaFunilId) {
    const error = new Error(ErrorMessages.invalidEtapaFunilId)
    error.statusCode = 400
    throw error
  }

  const [usuariosCount, lead, etapa] = await Promise.all([
    prisma.usuario.count({ where: { id: { in: responsaveisIds } } }),
    prisma.lead.findUnique({ where: { id: leadId } }),
    prisma.etapaFunil.findUnique({ where: { id: etapaFunilId } }),
  ])

  if (usuariosCount !== responsaveisIds.length) {
    const error = new Error(ErrorMessages.responsaveisNotFound)
    error.statusCode = 400
    throw error
  }
  if (!lead) {
    const error = new Error(ErrorMessages.leadRefNotFound)
    error.statusCode = 400
    throw error
  }
  if (!etapa) {
    const error = new Error(ErrorMessages.etapaFunilNotFound)
    error.statusCode = 400
    throw error
  }
  if (etapa.ordem < 4) {
    const error = new Error('Negócios só podem ser criados ou movidos a partir da fase de Proposta.')
    error.statusCode = 400
    throw error
  }

  const data = {
    titulo,
    valorEstimado,
    leadId,
    etapaFunilId,
    responsaveisIds,
  }

  return data
}

const negocioListInclude = {
  ...negocioInclude,
  tarefas: {
    where: { status: 'Pendente' },
    select: { dataPrazo: true },
  },
}

export const listNegocios = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query)
  const where = usuarioId
    ? {
        responsaveis: {
          some: { id: usuarioId },
        },
      }
    : {}

  const negocios = await prisma.negocio.findMany({
    where,
    include: negocioListInclude,
    orderBy: { dataCriacao: 'desc' },
  })

  const mapped = negocios.map((negocio) => {
    const resumo = buildTarefaResumo(collectNegocioPendingDates(negocio))
    return {
      ...mapNegocioToResponse(negocio),
      ...resumo,
      dataCriacaoMs: negocio.dataCriacao.getTime(),
    }
  })

  return sortByPendingTasks(mapped, (item) => item.dataCriacaoMs).map(
    ({ prazoMaisProximoMs, dataCriacaoMs, ...item }) => item
  )
}


export const listNegociosFunil = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query.usuarioId)
  const nome = normalizeString(query.nome)
  const cnpj = normalizeString(query.cnpj)
  const empresa = normalizeString(query.empresa)
  const temperatura = query.temperatura

  const where = {}

  if (usuarioId) {
    where.responsaveis = {
      some: { id: usuarioId },
    }
  }

  if (nome || cnpj || empresa) {
    where.lead = {}

    if (nome) {
      where.lead.nome = {
        contains: nome,
        mode: 'insensitive',
      }
    }

    if (cnpj) {
      where.lead.cnpj = {
        contains: cnpj,
        mode: 'insensitive',
      }
    }

    if (empresa) {
      where.lead.empresa = {
        contains: empresa,
        mode: 'insensitive',
      }
    }
  }

  const leadsWhere = {
    status: 'Ativo',
    etapaFunil: { ordem: { lt: 4 } },
    ...(usuarioId ? { usuarioId } : {}),
    ...(nome ? { nome: { contains: nome, mode: 'insensitive' } } : {}),
    ...(cnpj ? { cnpj: { contains: cnpj, mode: 'insensitive' } } : {}),
    ...(empresa ? { empresa: { contains: empresa, mode: 'insensitive' } } : {}),
    negocios: {
      none: {
        etapaFunil: { ordem: { gte: 4, lte: 6 } },
      },
    },
  }

  const [etapas, negocios, leads] = await Promise.all([
    prisma.etapaFunil.findMany({
      orderBy: { ordem: 'asc' },
    }),

    prisma.negocio.findMany({
      where,
      include: {
        ...negocioInclude,
        historicoEtapas: {
          where: { saidaEm: null },
          orderBy: { entradaEm: 'desc' },
          take: 1,
        },
      },
      orderBy: { dataCriacao: 'desc' },
    }),

    prisma.lead.findMany({
      where: leadsWhere,
      include: {
        usuario: { select: { id: true, nome: true, avatarUrl: true } },
        tarefas: {
          where: { status: 'Pendente' },
          select: { id: true, dataPrazo: true },
        },
        historicoEtapas: {
          where: { saidaEm: null },
          orderBy: { entradaEm: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const agora = Date.now()
  const MS_PER_DAY = 1000 * 60 * 60 * 24

  const mappedLeads = leads.map((lead) => {
    const ultimaEntrada = lead.historicoEtapas?.[0]?.entradaEm || lead.createdAt
    const diasNaEtapa = Math.floor((agora - new Date(ultimaEntrada).getTime()) / MS_PER_DAY)
    const pendingDates = collectLeadPendingDates(lead.tarefas || [])

    return {
      id: `lead_${lead.id}`,
      cardId: `lead_${lead.id}`,
      leadId: lead.id,
      negocioId: null,
      tipoCard: 'lead',
      titulo: lead.empresa ? `${lead.empresa} (${lead.nome})` : lead.nome,
      lead: lead.nome,
      empresa: lead.empresa,
      cidade: lead.cidade,
      responsavel: lead.usuario?.nome ?? 'Sem responsável',
      responsaveis: lead.usuario ? [{ id: lead.usuario.id, nome: lead.usuario.nome }] : [],
      responsaveisIds: lead.usuarioId ? [lead.usuarioId] : [],
      usuarioId: lead.usuarioId,
      etapaFunilId: lead.etapaFunilId,
      valor: null,
      valorEstimado: 0,
      diasNaEtapa: Math.max(0, diasNaEtapa),
      tarefasPendentes: lead.tarefas?.length ?? 0,
      prazoMaisProximo: pendingDates[0] ? formatDateBr(pendingDates[0]) : null,
    }
  })

  const mappedNegocios = negocios.map((op) => {
    const response = mapNegocioToResponse(op)
    const ultimaEntrada = op.historicoEtapas?.[0]?.entradaEm || op.dataCriacao
    const diasNaEtapa = Math.floor((agora - new Date(ultimaEntrada).getTime()) / MS_PER_DAY)

    return {
      ...response,
      cardId: String(op.id),
      negocioId: op.id,
      tipoCard: 'negocio',
      diasNaEtapa: Math.max(0, diasNaEtapa),
    }
  })

  const range = parseTemperaturaRange(temperatura)
  const filtradosLeads = range
    ? mappedLeads.filter((item) => item.diasNaEtapa >= range.min && item.diasNaEtapa <= range.max)
    : mappedLeads
  const filtradosNegocios = range
    ? mappedNegocios.filter((item) => item.diasNaEtapa >= range.min && item.diasNaEtapa <= range.max)
    : mappedNegocios

  const funil = {}

  for (const etapa of etapas) {
    if (etapa.ordem < 4) {
      funil[etapa.nome] = filtradosLeads.filter((item) => item.etapaFunilId === etapa.id)
    } else {
      funil[etapa.nome] = filtradosNegocios.filter((item) => item.etapaFunilId === etapa.id)
    }
  }

  return { funil }
}


export const getNegocioById = async (idParam) => {
  const id = parseNegocioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id },
    include: negocioInclude,
  })

  if (!negocio) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  return mapNegocioToResponse(negocio)
}

export const createNegocio = async (body) => {
  const { responsaveisIds, ...rest } = await buildNegocioData(body)

  const negocio = await prisma.$transaction(async (tx) => {
    const created = await tx.negocio.create({
      data: {
        ...rest,
        responsaveis: {
          connect: responsaveisIds.map((id) => ({ id })),
        },
      },
      include: negocioInclude,
    })
    await registrarEntradaEtapa(tx, created.id, created.etapaFunilId, created.dataCriacao)
    await registrarResponsaveisNegocio(tx, created.id, responsaveisIds, created.dataCriacao)

    // Atualiza o lead para a etapa do negócio (promovido a negócio)
    const etapaAbertaLead = await tx.leadEtapaHistorico.findFirst({
      where: { leadId: rest.leadId, saidaEm: null },
      orderBy: { entradaEm: 'desc' },
    })
    if (etapaAbertaLead) {
      await tx.leadEtapaHistorico.update({
        where: { id: etapaAbertaLead.id },
        data: { saidaEm: created.dataCriacao },
      })
    }
    await tx.lead.update({
      where: { id: rest.leadId },
      data: { etapaFunilId: created.etapaFunilId },
    })

    return created
  }, TransactionOptions)

  return mapNegocioToResponse(negocio)
}

export const updateNegocio = async (idParam, body) => {
  const id = parseNegocioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.negocio.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  const { responsaveisIds, ...rest } = await buildNegocioData(body)
  const etapaAlterada = rest.etapaFunilId !== existing.etapaFunilId

  const negocio = await prisma.$transaction(async (tx) => {
    if (etapaAlterada) {
      await registrarMudancaEtapa(tx, id, rest.etapaFunilId)
    }

    await sincronizarResponsaveisNegocio(tx, id, responsaveisIds)

    return tx.negocio.update({
      where: { id },
      data: {
        ...rest,
        responsaveis: {
          set: responsaveisIds.map((id) => ({ id })),
        },
      },
      include: negocioInclude,
    })
  }, TransactionOptions)

  return mapNegocioToResponse(negocio)
}

const NEGOCIO_EXCLUIDO_PREFIX = '__CRM_NEGOCIO_EXCLUIDO__'

export const deleteNegocio = async (idParam, usuarioIdParam = null) => {
  const id = parseNegocioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.negocio.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, nome: true, usuarioId: true } },
      responsaveis: { select: { id: true } },
      tarefas: { select: { id: true } },
      interacoes: { select: { id: true } },
    },
  })
  if (!existing) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  const solicitanteId = parseRelationId(usuarioIdParam)
  const solicitante = solicitanteId
    ? await prisma.usuario.findUnique({ where: { id: solicitanteId }, select: { id: true } })
    : null
  const usuarioId = solicitante?.id ?? existing.responsaveis[0]?.id ?? existing.lead.usuarioId
  const dataExclusao = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.interacao.create({
      data: {
        tipo: 'Registro',
        descricao: `${NEGOCIO_EXCLUIDO_PREFIX}${JSON.stringify({
          negocioId: id,
          titulo: existing.titulo,
          leadNome: existing.lead.nome,
          responsavelIds: existing.responsaveis.map(({ id: responsavelId }) => responsavelId),
          tarefaIds: existing.tarefas.map(({ id: tarefaId }) => tarefaId),
          interacaoIds: existing.interacoes.map(({ id: interacaoId }) => interacaoId),
        })}`,
        dataInteracao: dataExclusao,
        leadId: existing.leadId,
        usuarioId,
      },
    })
    await tx.negocio.delete({ where: { id } })
  }, TransactionOptions)
}

export const marcarNegocioComoPerdida = async (idParam, body) => {
  const id = parseNegocioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const motivoPerdaId = parseRelationId(body.motivoPerdaId)
  if (!motivoPerdaId) {
    const error = new Error(ErrorMessages.motivoPerdaRequired)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.negocio.findUnique({
    where: { id },
    include: { responsaveis: { select: { id: true }, take: 1 } },
  })
  if (!existing) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  if (existing.motivoPerdaId) {
    const error = new Error(ErrorMessages.negocioJaPerdida)
    error.statusCode = 400
    throw error
  }

  const [motivo, etapaPerdida] = await Promise.all([
    prisma.motivoPerda.findFirst({ where: { id: motivoPerdaId, ativo: true } }),
    prisma.etapaFunil.findFirst({ where: { nome: 'Perdida' } }),
  ])

  if (!motivo) {
    const error = new Error(ErrorMessages.motivoPerdaNotFound)
    error.statusCode = 400
    throw error
  }

  if (!etapaPerdida) {
    const error = new Error(ErrorMessages.etapaPerdidaNotFound)
    error.statusCode = 400
    throw error
  }

  const usuarioId = parseRelationId(body.usuarioId) ?? existing.responsaveis?.[0]?.id ?? null

  const negocio = await prisma.$transaction(async (tx) => {
    await registrarMudancaEtapa(tx, id, etapaPerdida.id)

    const updated = await tx.negocio.update({
      where: { id },
      data: {
        motivoPerdaId,
        etapaFunilId: etapaPerdida.id,
      },
      include: negocioInclude,
    })

    if (usuarioId) {
      await tx.interacao.create({
        data: {
          tipo: 'Registro',
          descricao: `Negocio marcada como perdida. Motivo: ${motivo.nome}`,
          dataInteracao: new Date(),
          leadId: existing.leadId,
          negocioId: id,
          usuarioId,
        },
      })
    }

    return updated
  }, TransactionOptions)

  return mapNegocioToResponse(negocio)
}
