import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateTimeInput } from '../utils/date.js'
import {
  InteracaoTiposValidos,
  interacaoInclude,
  mapInteracaoToResponse,
} from '../utils/interacaoMapper.js'

const NEGOCIO_EXCLUIDO_PREFIX = '__CRM_NEGOCIO_EXCLUIDO__'

const parseId = (value) => {
  const parsed = Number(value)
  if (!value || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const parseUsuarioId = (usuarioId) => {
  const parsed = Number(usuarioId)
  if (!usuarioId || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const buildInteracaoData = async (body, leadId, fixedNegocioId = null) => {
  const tipo = body.tipo?.trim()
  if (!tipo) {
    const error = new Error(ErrorMessages.interacaoTipoRequired)
    error.statusCode = 400
    throw error
  }
  if (!InteracaoTiposValidos.includes(tipo)) {
    const error = new Error(ErrorMessages.interacaoTipoInvalid)
    error.statusCode = 400
    throw error
  }

  const descricao = body.descricao?.trim()
  if (!descricao) {
    const error = new Error(ErrorMessages.interacaoDescricaoRequired)
    error.statusCode = 400
    throw error
  }

  if (!body.dataInteracao) {
    const error = new Error(ErrorMessages.interacaoDataRequired)
    error.statusCode = 400
    throw error
  }

  const dataInteracao = parseDateTimeInput(body.dataInteracao)
  if (!dataInteracao) {
    const error = new Error(ErrorMessages.interacaoDataInvalid)
    error.statusCode = 400
    throw error
  }

  const targetNegocioId = fixedNegocioId || (body.negocioId ? parseId(body.negocioId) : null)
  let usuario = null
  const candidateUsuarioId = parseUsuarioId(body.usuarioId)

  if (candidateUsuarioId) {
    usuario = await prisma.usuario.findUnique({ where: { id: candidateUsuarioId } })
  }

  if (!usuario && targetNegocioId) {
    const neg = await prisma.negocio.findUnique({
      where: { id: targetNegocioId },
      include: { responsaveis: { select: { id: true }, take: 1 } },
    })
    const negUserId = neg?.responsaveis?.[0]?.id || neg?.usuarioId
    if (negUserId) {
      usuario = await prisma.usuario.findUnique({ where: { id: negUserId } })
    }
  }

  if (!usuario && leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { responsaveis: { select: { id: true }, take: 1 } },
    })
    const leadUserId = lead?.responsaveis?.[0]?.id || lead?.usuarioId
    if (leadUserId) {
      usuario = await prisma.usuario.findUnique({ where: { id: leadUserId } })
    }
  }

  if (!usuario) {
    usuario = await prisma.usuario.findFirst({
      where: { ativo: true },
      orderBy: { id: 'asc' },
    })
  }

  if (!usuario) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 400
    throw error
  }

  const usuarioId = usuario.id

  let negocioId = fixedNegocioId
  if (!negocioId && body.negocioId) {
    negocioId = parseId(body.negocioId)
    if (!negocioId) {
      const error = new Error(ErrorMessages.interacaoNegocioInvalid)
      error.statusCode = 400
      throw error
    }
  }

  if (negocioId) {
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true, leadId: true },
    })
    if (!negocio) {
      const error = new Error(ErrorMessages.interacaoNegocioNotFound)
      error.statusCode = 400
      throw error
    }
    if (negocio.leadId !== leadId) {
      const error = new Error(ErrorMessages.interacaoNegocioLeadMismatch)
      error.statusCode = 400
      throw error
    }
  }

  return {
    tipo,
    descricao,
    dataInteracao,
    leadId,
    negocioId: negocioId ?? null,
    usuarioId,
  }
}

const assertLeadExists = async (leadId) => {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead) {
    const error = new Error(ErrorMessages.leadNotFound)
    error.statusCode = 404
    throw error
  }
}

export const listInteracoesByLead = async (leadIdParam, query = {}) => {
  const leadId = parseId(leadIdParam)
  if (!leadId) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  await assertLeadExists(leadId)

  const negocioId = query.negocioId ? parseId(query.negocioId) : null
  const where = {
    leadId,
    NOT: { tipo: 'Registro', descricao: { startsWith: NEGOCIO_EXCLUIDO_PREFIX } },
  }
  if (negocioId) {
    where.negocioId = negocioId
  }

  const interacoes = await prisma.interacao.findMany({
    where,
    include: interacaoInclude,
    orderBy: { dataInteracao: 'desc' },
  })

  return interacoes.map(mapInteracaoToResponse)
}

export const listInteracoesByNegocio = async (negocioIdParam) => {
  const negocioId = parseId(negocioIdParam)
  if (!negocioId) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { id: true, leadId: true },
  })

  if (!negocio) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  const interacoes = await prisma.interacao.findMany({
    where: { negocioId },
    include: interacaoInclude,
    orderBy: { dataInteracao: 'desc' },
  })

  return interacoes.map(mapInteracaoToResponse)
}

export const createInteracaoForLead = async (leadIdParam, body) => {
  const leadId = parseId(leadIdParam)
  if (!leadId) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  await assertLeadExists(leadId)
  const data = await buildInteracaoData(body, leadId)

  const interacao = await prisma.interacao.create({
    data,
    include: interacaoInclude,
  })

  return mapInteracaoToResponse(interacao)
}

export const createInteracaoForNegocio = async (negocioIdParam, body) => {
  const negocioId = parseId(negocioIdParam)
  if (!negocioId) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { id: true, leadId: true },
  })

  if (!negocio) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  const data = await buildInteracaoData(body, negocio.leadId, negocioId)

  const interacao = await prisma.interacao.create({
    data,
    include: interacaoInclude,
  })

  return mapInteracaoToResponse(interacao)
}

export const updateInteracao = async (idParam, body) => {
  const id = parseId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidInteracaoId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.interacao.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.interacaoNotFound)
    error.statusCode = 404
    throw error
  }

  const data = await buildInteracaoData(body, existing.leadId, existing.negocioId)

  const interacao = await prisma.interacao.update({
    where: { id },
    data,
    include: interacaoInclude,
  })

  return mapInteracaoToResponse(interacao)
}

export const deleteInteracao = async (idParam) => {
  const id = parseId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidInteracaoId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.interacao.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.interacaoNotFound)
    error.statusCode = 404
    throw error
  }

  await prisma.interacao.delete({ where: { id } })
}
