import prisma from '../lib/prisma.js'

export const registrarEntradaEtapaLead = async (
  tx,
  leadId,
  etapaFunilId,
  entradaEm = new Date()
) => {
  return tx.leadEtapaHistorico.create({
    data: {
      leadId,
      etapaFunilId,
      entradaEm,
    },
  })
}

export const registrarMudancaEtapaLead = async (
  tx,
  leadId,
  novaEtapaFunilId,
  momento = new Date()
) => {
  const etapaAberta = await tx.leadEtapaHistorico.findFirst({
    where: { leadId, saidaEm: null },
    orderBy: { entradaEm: 'desc' },
  })

  if (etapaAberta) {
    if (etapaAberta.etapaFunilId === novaEtapaFunilId) return
    await tx.leadEtapaHistorico.update({
      where: { id: etapaAberta.id },
      data: { saidaEm: momento },
    })
  }

  await registrarEntradaEtapaLead(tx, leadId, novaEtapaFunilId, momento)
}

