import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseValorEstimado } from '../utils/currency.js'
import { mapNegocioToResponse, negocioInclude } from '../utils/negocioMapper.js'
import { parsePrioridade } from '../utils/prioridade.js'
import { parseUsuarioIdFilter } from '../utils/usuarioFilter.js'
import {
  calcularTempoMedioPorEtapa,
  registrarEntradaEtapa,
  registrarMudancaEtapa,
} from './negocioEtapaHistorico.service.js'
import {
  buildTarefaResumo,
  collectNegocioPendingDates,
  sortByPendingTasks,
} from '../utils/tarefaResumo.js'

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

  const prioridade = parsePrioridade(body.prioridade)
  if (!prioridade) {
    const error = new Error(ErrorMessages.invalidPrioridade)
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

  const data = {
    titulo,
    valorEstimado,
    prioridade,
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
  const usuarioId = parseUsuarioIdFilter(query)
  const where = usuarioId
    ? {
        responsaveis: {
          some: { id: usuarioId },
        },
      }
    : {}

  const [etapas, negocios] = await Promise.all([
    prisma.etapaFunil.findMany({ orderBy: { ordem: 'asc' } }),
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
  ])

  const agora = Date.now()
  const MS_PER_DAY = 1000 * 60 * 60 * 24

  const mapped = negocios.map((op) => {
    const response = mapNegocioToResponse(op)
    const ultimaEntrada = op.historicoEtapas?.[0]?.entradaEm || op.dataCriacao
    const diasNaEtapa = Math.floor((agora - new Date(ultimaEntrada).getTime()) / MS_PER_DAY)
    return {
      ...response,
      diasNaEtapa: Math.max(0, diasNaEtapa),
    }
  })

  const funil = {}

  for (const etapa of etapas) {
    funil[etapa.nome] = mapped.filter((item) => item.etapaFunilId === etapa.id)
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
    return created
  })

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
  })

  return mapNegocioToResponse(negocio)
}

export const deleteNegocio = async (idParam) => {
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

  await prisma.negocio.delete({ where: { id } })
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
  })

  return mapNegocioToResponse(negocio)
}
