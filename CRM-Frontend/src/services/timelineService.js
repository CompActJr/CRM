import { apiRequest } from './apiClient.js'

export const fetchTimelineByLead = (leadId) => apiRequest(`/leads/${leadId}/timeline`)

export const fetchTimelineByNegocio = (negocioId) =>
  apiRequest(`/negocios/${negocioId}/timeline`)
