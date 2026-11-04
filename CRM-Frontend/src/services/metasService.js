import { apiRequest } from './apiClient'

export async function fetchMetasDashboard(params = {}) {
  const query = new URLSearchParams()

  if (params.meses && params.meses !== 'custom') {
    query.append('meses', params.meses)
  }
  if (params.dataInicio) {
    query.append('dataInicio', params.dataInicio)
  }
  if (params.dataFim) {
    query.append('dataFim', params.dataFim)
  }
  if (params.usuarioId) {
    query.append('usuarioId', params.usuarioId)
  }
  if (params.tipoMeta && params.tipoMeta !== 'todos') {
    query.append('tipoMeta', params.tipoMeta)
  }

  const queryString = query.toString()
  return apiRequest(`/metas/dashboard${queryString ? `?${queryString}` : ''}`)
}

export async function fetchMetasContribuicoes({ usuarioId, tipoMeta, dataInicio, dataFim }) {
  const query = new URLSearchParams()
  if (usuarioId) query.append('usuarioId', usuarioId)
  if (tipoMeta) query.append('tipoMeta', tipoMeta)
  if (dataInicio) query.append('dataInicio', dataInicio)
  if (dataFim) query.append('dataFim', dataFim)

  return apiRequest(`/metas/contribuicoes?${query.toString()}`)
}

