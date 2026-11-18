export const ETAPA_PERDIDA = 'Perdida'

export const isEtapaVendida = (nomeEtapa) => {
  if (!nomeEtapa) return false
  const lower = nomeEtapa.toLowerCase()
  return (
    lower.includes('pós venda') ||
    lower.includes('pos venda') ||
    lower.includes('pós-venda') ||
    lower.includes('fechado') ||
    lower.includes('ganho') ||
    lower.includes('vendido')
  )
}

export const isEtapaProposta = (nomeEtapa, ordem) => {
  if (ordem === 4) return true
  if (!nomeEtapa) return false
  return nomeEtapa.toLowerCase().includes('proposta')
}

export const findEtapaPosVenda = (etapas = []) =>
  etapas.find((etapa) => isEtapaVendida(etapa.nome)) ||
  etapas.find((etapa) => etapa.ordem === 6) ||
  null

export const isTituloGenerico = (titulo) => {
  if (!titulo) return true
  const lower = titulo.trim().toLowerCase()
  return (
    lower === 'venda de serviço' ||
    lower === 'venda de servico' ||
    lower === 'venda de serviços' ||
    lower === 'venda de servicos' ||
    lower === 'venda de consultoria' ||
    lower === 'serviço' ||
    lower === 'servico'
  )
}

export const getTemperaturaInfo = (diasNaEtapa) => {
  const dias = Number(diasNaEtapa ?? 0)
  if (dias >= 7) {
    return {
      key: 'frio',
      nome: 'Frio',
      label: `Frio ${dias >= 1 ? `(${dias} dias)` : ''}`.trim(),
    }
  }
  if (dias >= 5) {
    return {
      key: 'morno',
      nome: 'Morno',
      label: `Morno ${dias >= 1 ? `(${dias} dias)` : ''}`.trim(),
    }
  }
  return {
    key: 'quente',
    nome: 'Quente',
    label: `Quente ${dias >= 1 ? `(${dias} dias)` : ''}`.trim(),
  }
}

export const getFunilCardDisplayTitle = (item) =>
  item?.empresa || item?.lead || item?.titulo || ''

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

export const hasValidValorEstimado = (valor) => {
  const numeric = Number(valor)
  return Number.isFinite(numeric) && numeric > 0
}

export const buildUpdatePayload = (negocio, etapaFunilId) => ({
  titulo: negocio.titulo,
  valorEstimado: negocio.valorEstimado,
  responsaveisIds:
    negocio.responsaveisIds ??
    (negocio.responsaveis ? negocio.responsaveis.map((r) => r.id) : [negocio.usuarioId].filter(Boolean)),
  usuarioId: negocio.usuarioId,
  leadId: negocio.leadId,
  etapaFunilId,
})
