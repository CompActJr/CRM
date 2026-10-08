import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateInput } from '../utils/date.js'
import {
  TarefaStatusValidos,
  mapTarefaToResponse,
  tarefaInclude,
} from '../utils/tarefaMapper.js'

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

const parseStatus = (value) => {
  if (!value) return null
  const normalized = String(value).trim()
  if (normalized === 'Concluída') return 'Concluida'
  if (TarefaStatusValidos.includes(normalized)) return normalized
  return null
}

const buildTarefaData = async (body, leadId, fixedNegocioId = null) => {
  const titulo = body.titulo?.trim()
  if (!titulo) {
    const error = new Error(ErrorMessages.tarefaTituloRequired)
    error.statusCode = 400
    throw error
  }

  if (!body.dataPrazo) {
    const error = new Error(ErrorMessages.tarefaDataPrazoRequired)
    error.statusCode = 400
    throw error
  }

  const dataPrazo = parseDateInput(body.dataPrazo)
  if (!dataPrazo) {
    const error = new Error(ErrorMessages.tarefaDataPrazoInvalid)
    error.statusCode = 400
    throw error
  }

  const usuarioId = parseUsuarioId(body.usuarioId)
  if (!usuarioId) {
    const error = new Error(ErrorMessages.invalidUsuarioId)
    error.statusCode = 400
    throw error
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
  if (!usuario) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 400
    throw error
  }

  let status = 'Pendente'
  if (body.status !== undefined) {
    const parsedStatus = parseStatus(body.status)
    if (!parsedStatus) {
      const error = new Error(ErrorMessages.tarefaStatusInvalid)
      error.statusCode = 400
      throw error
    }
    status = parsedStatus
  }

  let negocioId = fixedNegocioId
  if (!negocioId && body.negocioId) {
    negocioId = parseId(body.negocioId)
    if (!negocioId) {
      const error = new Error(ErrorMessages.tarefaNegocioInvalid)
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
      const error = new Error(ErrorMessages.tarefaNegocioNotFound)
      error.statusCode = 400
      throw error
    }
    if (negocio.leadId !== leadId) {
      const error = new Error(ErrorMessages.tarefaNegocioLeadMismatch)
      error.statusCode = 400
      throw error
    }
  }

  return {
    titulo,
    descricao: body.descricao?.trim() || null,
    dataPrazo,
    status,
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

const sortTarefas = (tarefas) =>
  [...tarefas].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'Pendente' ? -1 : 1
    }
    return new Date(a.dataPrazo).getTime() - new Date(b.dataPrazo).getTime()
  })

export const listTarefasByLead = async (leadIdParam, query = {}) => {
  const leadId = parseId(leadIdParam)
  if (!leadId) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  await assertLeadExists(leadId)

  const negocioId = query.negocioId ? parseId(query.negocioId) : null
  const apenasLead = query.apenasLead === 'true' || query.apenasLead === '1'
  const where = { leadId }

  if (negocioId) {
    where.negocioId = negocioId
  } else if (apenasLead) {
    where.negocioId = null
  }

  const tarefas = await prisma.tarefa.findMany({
    where,
    include: tarefaInclude,
  })

  return sortTarefas(tarefas).map(mapTarefaToResponse)
}

export const listTarefasByNegocio = async (negocioIdParam) => {
  const negocioId = parseId(negocioIdParam)
  if (!negocioId) {
    const error = new Error(ErrorMessages.invalidNegocioId)
    error.statusCode = 400
    throw error
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { id: true },
  })

  if (!negocio) {
    const error = new Error(ErrorMessages.negocioNotFound)
    error.statusCode = 404
    throw error
  }

  const tarefas = await prisma.tarefa.findMany({
    where: { negocioId },
    include: tarefaInclude,
  })

  return sortTarefas(tarefas).map(mapTarefaToResponse)
}

export const createTarefaForLead = async (leadIdParam, body) => {
  const leadId = parseId(leadIdParam)
  if (!leadId) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  await assertLeadExists(leadId)
  const { negocioId: _ignored, ...leadBody } = body
  const data = await buildTarefaData(leadBody, leadId)

  const tarefa = await prisma.tarefa.create({
    data,
    include: tarefaInclude,
  })

  return mapTarefaToResponse(tarefa)
}

export const createTarefaForNegocio = async (negocioIdParam, body) => {
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

  const data = await buildTarefaData(body, negocio.leadId, negocioId)

  const tarefa = await prisma.tarefa.create({
    data,
    include: tarefaInclude,
  })

  return mapTarefaToResponse(tarefa)
}

export const updateTarefa = async (idParam, body) => {
  const id = parseId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidTarefaId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.tarefa.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.tarefaNotFound)
    error.statusCode = 404
    throw error
  }

  const data = await buildTarefaData(body, existing.leadId, existing.negocioId)

  const tarefa = await prisma.tarefa.update({
    where: { id },
    data,
    include: tarefaInclude,
  })

  return mapTarefaToResponse(tarefa)
}

export const toggleTarefaStatus = async (idParam) => {
  const id = parseId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidTarefaId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.tarefa.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.tarefaNotFound)
    error.statusCode = 404
    throw error
  }

  const tarefa = await prisma.tarefa.update({
    where: { id },
    data: {
      status: existing.status === 'Pendente' ? 'Concluida' : 'Pendente',
    },
    include: tarefaInclude,
  })

  return mapTarefaToResponse(tarefa)
}

export const deleteTarefa = async (idParam) => {
  const id = parseId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidTarefaId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.tarefa.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.tarefaNotFound)
    error.statusCode = 404
    throw error
  }

  await prisma.tarefa.delete({ where: { id } })
}
