import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateInput } from '../utils/date.js'
import { parseUsuarioIdFilter } from '../utils/usuarioFilter.js'
import {
  leadIncludeDetail,
  leadIncludeUsuario,
  mapLeadDetailToResponse,
  mapLeadToResponse,
} from '../utils/leadMapper.js'
import {
  buildTarefaResumo,
  collectLeadPendingDates,
  sortByPendingTasks,
} from '../utils/tarefaResumo.js'

const parseLeadId = (id) => {
  const parsed = Number(id)
  if (!id || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const parseUsuarioId = (usuarioId) => {
  const parsed = Number(usuarioId)
  if (!usuarioId || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const parseStatusFilter = (query) => {
  if (query.status === 'Ativo' || query.status === 'Inativo') {
    return query.status
  }
  return null
}

const buildLeadData = async (body) => {
  const nome = body.nome?.trim()
  if (!nome) {
    const error = new Error(ErrorMessages.nomeRequired)
    error.statusCode = 400
    throw error
  }

  const dataCadastro = parseDateInput(body.dataCadastro)
  if (!dataCadastro) {
    const error = new Error(
      body.dataCadastro ? ErrorMessages.invalidDataCadastro : ErrorMessages.dataCadastroRequired
    )
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

  const status = body.status === 'Inativo' ? 'Inativo' : 'Ativo'

  return {
    nome,
    email: body.email?.trim() || null,
    telefone: body.telefone?.trim() || null,
    empresa: body.empresa?.trim() || null,
    cidade: body.cidade?.trim() || null,
    nicho: body.nicho?.trim() || null,
    observacoes: body.observacoes?.trim() || null,
    status,
    dataCadastro,
    usuarioId,
  }
}

const leadListInclude = {
  ...leadIncludeUsuario,
  tarefas: {
    where: { status: 'Pendente', oportunidadeId: null },
    select: { dataPrazo: true },
  },
}

export const listLeads = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query)
  const status = parseStatusFilter(query)
  const dataInicio = parseDateInput(query.dataInicio)
  const dataFim = parseDateInput(query.dataFim)
  if (query.dataInicio && !dataInicio) {
    const error = new Error(ErrorMessages.invalidDataInicio)
    error.statusCode = 400
    throw error
  }
  if (query.dataFim && !dataFim) {
    const error = new Error(ErrorMessages.invalidDataFim)
    error.statusCode = 400
    throw error
  }
  if (dataInicio && dataFim && dataInicio > dataFim) {
    const error = new Error(ErrorMessages.invalidDataRange)
    error.statusCode = 400
    throw error
  }

  const where = {}

  if (usuarioId) {
    where.usuarioId = usuarioId
  }

  if (query.nome) {
    where.nome = query.nome
  }

  if (query.empresa) {
    where.empresa = query.empresa
  }

  if (query.cidade) {
    where.cidade = query.cidade
  }

  if (dataInicio || dataFim) {
    where.dataCadastro = {}

    if (dataInicio) {
      where.dataCadastro.gte = dataInicio
    }

    if (dataFim) {
      where.dataCadastro.lte = dataFim
    }
  }

  if (status) {
    where.status = status
  }

  if (query.nicho) {
    where.nicho = query.nicho
  }

  const leads = await prisma.lead.findMany({
    where,
    include: leadListInclude,
    orderBy: { dataCadastro: 'desc' },
  })

  const mapped = leads.map((lead) => {
    const resumo = buildTarefaResumo(collectLeadPendingDates(lead))
    return {
      ...mapLeadToResponse(lead),
      ...resumo,
      dataCadastroMs: lead.dataCadastro.getTime(),
    }
  })

  return sortByPendingTasks(mapped, (item) => item.dataCadastroMs).map(
    ({ prazoMaisProximoMs, dataCadastroMs, ...item }) => item
  )
}

export const getLeadById = async (idParam) => {
  const id = parseLeadId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: leadIncludeDetail,
  })

  if (!lead) {
    const error = new Error(ErrorMessages.leadNotFound)
    error.statusCode = 404
    throw error
  }

  return mapLeadDetailToResponse(lead)
}

export const createLead = async (body) => {
  const data = await buildLeadData(body)
  const lead = await prisma.lead.create({
    data,
    include: leadIncludeUsuario,
  })
  return mapLeadToResponse(lead)
}

export const updateLead = async (idParam, body) => {
  const id = parseLeadId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.leadNotFound)
    error.statusCode = 404
    throw error
  }

  const data = await buildLeadData(body)
  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: leadIncludeUsuario,
  })
  return mapLeadToResponse(lead)
}

export const deleteLead = async (idParam) => {
  const id = parseLeadId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidLeadId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.lead.findUnique({
    where: { id },
    include: { oportunidades: { select: { id: true }, take: 1 } },
  })

  if (!existing) {
    const error = new Error(ErrorMessages.leadNotFound)
    error.statusCode = 404
    throw error
  }

  if (existing.oportunidades.length > 0) {
    const error = new Error(ErrorMessages.leadHasOportunidades)
    error.statusCode = 409
    throw error
  }

  await prisma.lead.delete({ where: { id } })
}
