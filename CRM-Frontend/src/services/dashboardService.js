import { apiRequest } from './apiClient'

export async function fetchDashboardStats(params = 6) {
  const meses = typeof params === 'object' ? params.meses : params
  const dataInicio = typeof params === 'object' ? params.dataInicio : null
  const dataFim = typeof params === 'object' ? params.dataFim : null

  let queryPath = '/dashboard?'
  if (meses === 'custom') {
    queryPath += `dataInicio=${encodeURIComponent(dataInicio || '')}&dataFim=${encodeURIComponent(dataFim || '')}`
  } else {
    queryPath += `meses=${encodeURIComponent(meses)}`
  }

  return apiRequest(queryPath)
}

export async function fetchDashboardAtividades() {
  return apiRequest('/dashboard/atividades')
}

export async function fetchTermometroMej(ano) {
  const query = ano ? `?ano=${encodeURIComponent(ano)}` : ''
  return apiRequest(`/dashboard/termometro-mej${query}`)
}

export async function syncTermometroMej() {
  return apiRequest('/dashboard/termometro-mej/sync', {
    method: 'POST',
  })
}

