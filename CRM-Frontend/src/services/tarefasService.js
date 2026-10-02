import { apiRequest } from './apiClient.js'

export const fetchTarefasByLead = (leadId, params = {}) => {
  const search = new URLSearchParams()
  if (params.apenasLead) search.set('apenasLead', 'true')
  if (params.negocioId) search.set('negocioId', params.negocioId)
  const query = search.toString()
  const suffix = query ? `?${query}` : ''
  return apiRequest(`/leads/${leadId}/tarefas${suffix}`)
}

export const createTarefaForLead = (leadId, payload) =>
  apiRequest(`/leads/${leadId}/tarefas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const fetchTarefasByNegocio = (negocioId) =>
  apiRequest(`/negocios/${negocioId}/tarefas`)

export const createTarefaForNegocio = (negocioId, payload) =>
  apiRequest(`/negocios/${negocioId}/tarefas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const toggleTarefaStatus = (id) =>
  apiRequest(`/tarefas/${id}/status`, {
    method: 'PATCH',
  })

export const deleteTarefa = (id) =>
  apiRequest(`/tarefas/${id}`, {
    method: 'DELETE',
  })

export const updateTarefa = (id, payload) =>
  apiRequest(`/tarefas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
