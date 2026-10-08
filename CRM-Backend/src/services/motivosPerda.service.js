import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { mapMotivoPerdaToResponse } from '../utils/motivoPerdaMapper.js'

const parseMotivoPerdaId = (id) => {
  const parsed = Number(id)
  if (!id || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const buildMotivoData = (body) => {
  const nome = body.nome?.trim()
  if (!nome) {
    const error = new Error(ErrorMessages.motivoPerdaNomeRequired)
    error.statusCode = 400
    throw error
  }

  const data = { nome }
  if (body.ativo !== undefined) {
    data.ativo = Boolean(body.ativo)
  }

  return data
}

export const listMotivosPerda = async (query = {}) => {
  const onlyActive = query.ativos === 'true' || query.ativos === '1'

  const motivos = await prisma.motivoPerda.findMany({
    where: onlyActive ? { ativo: true } : undefined,
    orderBy: { nome: 'asc' },
  })

  return motivos.map(mapMotivoPerdaToResponse)
}

export const getMotivoPerdaById = async (idParam) => {
  const id = parseMotivoPerdaId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidMotivoPerdaId)
    error.statusCode = 400
    throw error
  }

  const motivo = await prisma.motivoPerda.findUnique({ where: { id } })
  if (!motivo) {
    const error = new Error(ErrorMessages.motivoPerdaNotFound)
    error.statusCode = 404
    throw error
  }

  return mapMotivoPerdaToResponse(motivo)
}

export const createMotivoPerda = async (body) => {
  const data = buildMotivoData(body)

  try {
    const motivo = await prisma.motivoPerda.create({ data })
    return mapMotivoPerdaToResponse(motivo)
  } catch (error) {
    if (error.code === 'P2002') {
      const duplicate = new Error(ErrorMessages.motivoPerdaNomeInUse)
      duplicate.statusCode = 400
      throw duplicate
    }
    throw error
  }
}

export const updateMotivoPerda = async (idParam, body) => {
  const id = parseMotivoPerdaId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidMotivoPerdaId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.motivoPerda.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.motivoPerdaNotFound)
    error.statusCode = 404
    throw error
  }

  const data = buildMotivoData(body)

  try {
    const motivo = await prisma.motivoPerda.update({ where: { id }, data })
    return mapMotivoPerdaToResponse(motivo)
  } catch (error) {
    if (error.code === 'P2002') {
      const duplicate = new Error(ErrorMessages.motivoPerdaNomeInUse)
      duplicate.statusCode = 400
      throw duplicate
    }
    throw error
  }
}

export const deleteMotivoPerda = async (idParam) => {
  const id = parseMotivoPerdaId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidMotivoPerdaId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.motivoPerda.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.motivoPerdaNotFound)
    error.statusCode = 404
    throw error
  }

  const inUse = await prisma.negocio.count({ where: { motivoPerdaId: id } })
  if (inUse > 0) {
    const error = new Error(ErrorMessages.motivoPerdaInUse)
    error.statusCode = 400
    throw error
  }

  await prisma.motivoPerda.delete({ where: { id } })
}
