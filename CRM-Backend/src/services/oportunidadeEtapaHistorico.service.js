import prisma from '../lib/prisma.js'
import { parseUsuarioIdFilter } from '../utils/usuarioFilter.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export const registrarEntradaEtapa = async (tx, oportunidadeId, etapaFunilId, entradaEm = new Date()) => {
  return tx.oportunidadeEtapaHistorico.create({
    data: {
      oportunidadeId,
      etapaFunilId,
      entradaEm,
    },
  })
}

export const registrarMudancaEtapa = async (
  tx,
  oportunidadeId,
  novaEtapaFunilId,
  momento = new Date()
) => {
  const etapaAberta = await tx.oportunidadeEtapaHistorico.findFirst({
    where: { oportunidadeId, saidaEm: null },
    orderBy: { entradaEm: 'desc' },
  })

  if (etapaAberta) {
    if (etapaAberta.etapaFunilId === novaEtapaFunilId) return
    await tx.oportunidadeEtapaHistorico.update({
      where: { id: etapaAberta.id },
      data: { saidaEm: momento },
    })
  }

  await registrarEntradaEtapa(tx, oportunidadeId, novaEtapaFunilId, momento)
}

export const calcularTempoMedioPorEtapa = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query)
  const filtroOportunidade = {}
  const oportunidadeWhere = {
    ...(usuarioId ? { usuarioId } : {}),
    ...(query.lead ? { lead: query.lead } : {}),
    ...(query.dataInicio || query.dataFim
      ? {
          dataCriacao: {
            ...(query.dataInicio ? { gte: query.dataInicio } : {}),
            ...(query.dataFim ? { lte: query.dataFim } : {}),
          },
        }
      : {}),
  }
  if (Object.keys(oportunidadeWhere).length > 0) {
    filtroOportunidade.oportunidade = { is: oportunidadeWhere }
  }

  const [etapas, registros] = await Promise.all([
    prisma.etapaFunil.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.oportunidadeEtapaHistorico.findMany({
      where: filtroOportunidade,
      include: { etapaFunil: { select: { nome: true } } },
    }),
  ])

  const duracoesPorEtapa = Object.fromEntries(etapas.map((etapa) => [etapa.nome, []]))
  const agora = Date.now()

  for (const registro of registros) {
    const nomeEtapa = registro.etapaFunil.nome
    const fim = registro.saidaEm ? registro.saidaEm.getTime() : agora
    const dias = (fim - registro.entradaEm.getTime()) / MS_PER_DAY
    if (dias < 0) continue
    duracoesPorEtapa[nomeEtapa].push(dias)
  }

  const tempoMedioPorEtapa = {}

  for (const etapa of etapas) {
    const duracoes = duracoesPorEtapa[etapa.nome]
    tempoMedioPorEtapa[etapa.nome] =
      duracoes.length > 0
        ? Math.round(duracoes.reduce((total, dias) => total + dias, 0) / duracoes.length)
        : null
  }

  return tempoMedioPorEtapa
}
