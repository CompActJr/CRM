import { ApiConfig } from '../config/api.js'
import { apiRequest } from './apiClient.js'

export const fetchPropostasByNegocio = (negocioId) =>
  apiRequest(`/negocios/${negocioId}/propostas`)

export const createProposta = (negocioId, payload) =>
  apiRequest(`/negocios/${negocioId}/propostas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateProposta = (id, payload) =>
  apiRequest(`/propostas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteProposta = (id) =>
  apiRequest(`/propostas/${id}`, {
    method: 'DELETE',
  })

export const downloadPropostaPdf = async (id) => {
  const response = await fetch(`${ApiConfig.baseUrl}/propostas/${id}/pdf`)

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Erro ao baixar PDF da proposta')
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filenameMatch = disposition.match(/filename="([^"]+)"/)
  const filename = filenameMatch?.[1] ?? `proposta-${id}.pdf`
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
