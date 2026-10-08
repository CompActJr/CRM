export const ETAPA_PERDIDA = 'Perdida'

export const resolveEtapaDestino = (overId, funil, etapasAtivas) => {
  if (!overId) return null
  const overKey = String(overId)
  if (etapasAtivas.includes(overKey)) return overKey
  for (const etapa of etapasAtivas) {
    const found = (funil[etapa] ?? []).some((item) => String(item.id) === overKey)
    if (found) return etapa
  }
  return null
}

export const findEtapaOrigem = (negocioId, funil, etapasAtivas) => {
  const idKey = String(negocioId)
  for (const etapa of etapasAtivas) {
    const found = (funil[etapa] ?? []).some((item) => String(item.id) === idKey)
    if (found) return etapa
  }
  return null
}

export const moveNegocioNoFunil = (funil, negocioId, etapaOrigem, etapaDestino) => {
  const idKey = String(negocioId)
  const origemLista = [...(funil[etapaOrigem] ?? [])]
  const indice = origemLista.findIndex((item) => String(item.id) === idKey)
  if (indice < 0) return funil
  const [item] = origemLista.splice(indice, 1)
  const destinoLista = [...(funil[etapaDestino] ?? []), item]
  return {
    ...funil,
    [etapaOrigem]: origemLista,
    [etapaDestino]: destinoLista,
  }
}

export const buildUpdatePayload = (negocio, etapaFunilId) => ({
  titulo: negocio.titulo,
  valorEstimado: negocio.valorEstimado,
  prioridade: negocio.prioridadeDb,
  responsaveisIds:
    negocio.responsaveisIds ??
    (negocio.responsaveis ? negocio.responsaveis.map((r) => r.id) : [negocio.usuarioId].filter(Boolean)),
  usuarioId: negocio.usuarioId,
  leadId: negocio.leadId,
  etapaFunilId,
})
