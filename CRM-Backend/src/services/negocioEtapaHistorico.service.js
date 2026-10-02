import prisma from '../lib/prisma.js'
import { parseUsuarioIdFilter } from '../utils/usuarioFilter.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export const registrarEntradaEtapa = async (tx, negocioId, etapaFunilId, entradaEm = new Date()) => {
  return tx.negocioEtapaHistorico.create({
    data: {
      negocioId,
      etapaFunilId,
      entradaEm,
    },
  })
}

export const registrarMudancaEtapa = async (
  tx,
  negocioId,
  novaEtapaFunilId,
  momento = new Date()
) => {
  const etapaAberta = await tx.negocioEtapaHistorico.findFirst({
    where: { negocioId, saidaEm: null },
    orderBy: { entradaEm: 'desc' },
  })

  if (etapaAberta) {
    if (etapaAberta.etapaFunilId === novaEtapaFunilId) return
    await tx.negocioEtapaHistorico.update({
      where: { id: etapaAberta.id },
      data: { saidaEm: momento },
    })
  }

  await registrarEntradaEtapa(tx, negocioId, novaEtapaFunilId, momento)
}

export const calcularTempoMedioPorEtapa = async (query = {}) => {
  const usuarioId = parseUsuarioIdFilter(query)
  const filtroNegocio = usuarioId ? { negocio: { responsaveis: { some: { id: usuarioId } } } } : {}

  const [etapas, registros] = await Promise.all([
    prisma.etapaFunil.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.negocioEtapaHistorico.findMany({
      where: filtroNegocio,
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
