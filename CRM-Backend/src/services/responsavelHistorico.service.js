const fecharRegistros = async (delegate, registros, momento) => {
  if (registros.length === 0) return
  await delegate.updateMany({
    where: { id: { in: registros.map((registro) => registro.id) } },
    data: { saidaEm: momento },
  })
}

export const registrarResponsavelLead = (tx, leadId, usuarioId, entradaEm) =>
  tx.leadResponsavelHistorico.create({
    data: { leadId, usuarioId, entradaEm },
  })

export const sincronizarResponsavelLead = async (tx, leadId, usuarioId, momento = new Date()) => {
  const abertos = await tx.leadResponsavelHistorico.findMany({
    where: { leadId, saidaEm: null },
  })

  if (abertos.length === 1 && abertos[0].usuarioId === usuarioId) return

  await fecharRegistros(tx.leadResponsavelHistorico, abertos, momento)
  await registrarResponsavelLead(tx, leadId, usuarioId, momento)
}

export const registrarResponsaveisNegocio = async (tx, negocioId, usuarioIds, entradaEm) => {
  if (usuarioIds.length === 0) return
  await tx.negocioResponsavelHistorico.createMany({
    data: usuarioIds.map((usuarioId) => ({ negocioId, usuarioId, entradaEm })),
  })
}

export const sincronizarResponsaveisNegocio = async (
  tx,
  negocioId,
  usuarioIds,
  momento = new Date()
) => {
  const abertos = await tx.negocioResponsavelHistorico.findMany({
    where: { negocioId, saidaEm: null },
  })

  const atuais = new Set(abertos.map((registro) => registro.usuarioId))
  const desejados = new Set(usuarioIds)

  await fecharRegistros(
    tx.negocioResponsavelHistorico,
    abertos.filter((registro) => !desejados.has(registro.usuarioId)),
    momento
  )

  const adicionados = usuarioIds.filter((usuarioId) => !atuais.has(usuarioId))
  await registrarResponsaveisNegocio(tx, negocioId, adicionados, momento)
}
