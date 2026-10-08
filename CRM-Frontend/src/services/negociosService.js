import { apiRequest } from './apiClient.js'
import { buildUsuarioFilterQuery } from '../utils/queryParams.js'

export const fetchNegocios = (params) =>
  apiRequest(`/negocios${buildUsuarioFilterQuery(params?.usuarioId)}`)

export const fetchNegocioById = (id) => apiRequest(`/negocios/${id}`)

export const fetchNegociosFunil = (params) =>
  apiRequest(`/negocios/funil${buildUsuarioFilterQuery(params?.usuarioId)}`)

export const createNegocio = (payload) =>
  apiRequest('/negocios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateNegocio = (id, payload) =>
  apiRequest(`/negocios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteNegocio = (id) =>
  apiRequest(`/negocios/${id}`, {
    method: 'DELETE',
  })

export const marcarNegocioPerdida = (id, payload) =>
  apiRequest(`/negocios/${id}/perder`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
