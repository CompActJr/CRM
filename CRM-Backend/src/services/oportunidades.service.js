import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseValorEstimado } from '../utils/currency.js'
import { mapOportunidadeToResponse, oportunidadeInclude } from '../utils/oportunidadeMapper.js'
import { parsePrioridade } from '../utils/prioridade.js'
import { parseUsuarioIdFilter } from '../utils/usuarioFilter.js'
import {
  calcularTempoMedioPorEtapa,
  registrarEntradaEtapa,
  registrarMudancaEtapa,
} from './oportunidadeEtapaHistorico.service.js'
import {
  buildTarefaResumo,
  collectOportunidadePendingDates,
  sortByPendingTasks,
} from '../utils/tarefaResumo.js'

const parseOportunidadeId = (id) => {
  const parsed = Number(id)
  if (!id || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const parseRelationId = (value) => {
  const parsed = Number(value)
  if (!value || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const buildOportunidadeData = async (body) => {
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

  const usuarioId = parseRelationId(body.usuarioId)
  if (!usuarioId) {
    const error = new Error(ErrorMessages.invalidUsuarioId)
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

  const [usuario, lead, etapa] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: usuarioId } }),
    prisma.lead.findUnique({ where: { id: leadId } }),
    prisma.etapaFunil.findUnique({ where: { id: etapaFunilId } }),
  ])

  if (!usuario) {
    const error = new Error(ErrorMessages.usuarioNotFound)
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
    usuarioId,
    leadId,
    etapaFunilId,
  }

  return data
}

const oportunidadeListInclude = {
  ...oportunidadeInclude,
  tarefas: {
    where: { status: 'Pendente' },
    select: { dataPrazo: true },
  },
}

export const listOportunidades = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query)
  const where = usuarioId ? { usuarioId } : {}

  const oportunidades = await prisma.oportunidade.findMany({
    where,
    include: oportunidadeListInclude,
    orderBy: { dataCriacao: 'desc' },
  })

  const mapped = oportunidades.map((oportunidade) => {
    const resumo = buildTarefaResumo(collectOportunidadePendingDates(oportunidade))
    return {
      ...mapOportunidadeToResponse(oportunidade),
      ...resumo,
      dataCriacaoMs: oportunidade.dataCriacao.getTime(),
    }
  })

  return sortByPendingTasks(mapped, (item) => item.dataCriacaoMs).map(
    ({ prazoMaisProximoMs, dataCriacaoMs, ...item }) => item
  )
}

export const listOportunidadesFunil = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query)
  const where = usuarioId ? { usuarioId } : {}

  const [etapas, oportunidades] = await Promise.all([
    prisma.etapaFunil.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.oportunidade.findMany({
      where,
      include: {
        ...oportunidadeInclude,
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

  const mapped = oportunidades.map((op) => {
    const response = mapOportunidadeToResponse(op)
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

export const getOportunidadeById = async (idParam) => {
  const id = parseOportunidadeId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidOportunidadeId)
    error.statusCode = 400
    throw error
  }

  const oportunidade = await prisma.oportunidade.findUnique({
    where: { id },
    include: oportunidadeInclude,
  })

  if (!oportunidade) {
    const error = new Error(ErrorMessages.oportunidadeNotFound)
    error.statusCode = 404
    throw error
  }

  return mapOportunidadeToResponse(oportunidade)
}

export const createOportunidade = async (body) => {
  const data = await buildOportunidadeData(body)

  const oportunidade = await prisma.$transaction(async (tx) => {
    const created = await tx.oportunidade.create({
      data,
      include: oportunidadeInclude,
    })
    await registrarEntradaEtapa(tx, created.id, created.etapaFunilId, created.dataCriacao)
    return created
  })

  return mapOportunidadeToResponse(oportunidade)
}

export const updateOportunidade = async (idParam, body) => {
  const id = parseOportunidadeId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidOportunidadeId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.oportunidade.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.oportunidadeNotFound)
    error.statusCode = 404
    throw error
  }

  const data = await buildOportunidadeData(body)
  const etapaAlterada = data.etapaFunilId !== existing.etapaFunilId

  const oportunidade = await prisma.$transaction(async (tx) => {
    if (etapaAlterada) {
      await registrarMudancaEtapa(tx, id, data.etapaFunilId)
    }

    return tx.oportunidade.update({
      where: { id },
      data,
      include: oportunidadeInclude,
    })
  })

  return mapOportunidadeToResponse(oportunidade)
}

export const deleteOportunidade = async (idParam) => {
  const id = parseOportunidadeId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidOportunidadeId)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.oportunidade.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.oportunidadeNotFound)
    error.statusCode = 404
    throw error
  }

  await prisma.oportunidade.delete({ where: { id } })
}

export const marcarOportunidadeComoPerdida = async (idParam, body) => {
  const id = parseOportunidadeId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidOportunidadeId)
    error.statusCode = 400
    throw error
  }

  const motivoPerdaId = parseRelationId(body.motivoPerdaId)
  if (!motivoPerdaId) {
    const error = new Error(ErrorMessages.motivoPerdaRequired)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.oportunidade.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.oportunidadeNotFound)
    error.statusCode = 404
    throw error
  }

  if (existing.motivoPerdaId) {
    const error = new Error(ErrorMessages.oportunidadeJaPerdida)
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

  const usuarioId = parseRelationId(body.usuarioId) ?? existing.usuarioId

  const oportunidade = await prisma.$transaction(async (tx) => {
    await registrarMudancaEtapa(tx, id, etapaPerdida.id)

    const updated = await tx.oportunidade.update({
      where: { id },
      data: {
        motivoPerdaId,
        etapaFunilId: etapaPerdida.id,
      },
      include: oportunidadeInclude,
    })

    await tx.interacao.create({
      data: {
        tipo: 'Registro',
        descricao: `Oportunidade marcada como perdida. Motivo: ${motivo.nome}`,
        dataInteracao: new Date(),
        leadId: existing.leadId,
        oportunidadeId: id,
        usuarioId,
      },
    })

    return updated
  })

  return mapOportunidadeToResponse(oportunidade)
}
