import { apiRequest } from './apiClient.js'

export const fetchInteracoesByLead = (leadId, params = {}) => {
  const search = new URLSearchParams()
  if (params.negocioId) search.set('negocioId', params.negocioId)
  const query = search.toString()
  const suffix = query ? `?${query}` : ''
  return apiRequest(`/leads/${leadId}/interacoes${suffix}`)
}

export const createInteracaoForLead = (leadId, payload) =>
  apiRequest(`/leads/${leadId}/interacoes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const fetchInteracoesByNegocio = (negocioId) =>
  apiRequest(`/negocios/${negocioId}/interacoes`)

export const createInteracaoForNegocio = (negocioId, payload) =>
  apiRequest(`/negocios/${negocioId}/interacoes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateInteracao = (id, payload) =>
  apiRequest(`/interacoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteInteracao = (id) =>
  apiRequest(`/interacoes/${id}`, {
    method: 'DELETE',
  })
