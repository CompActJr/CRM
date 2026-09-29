import { ApiConfig } from '../config/api.js'
import { apiRequest } from './apiClient.js'
import { buildUsuarioFilterQuery } from '../utils/queryParams.js'
import { buildLeadFilterQuery } from '../utils/queryParams.js'

export const fetchLeads = (params) => apiRequest(`/leads${buildLeadFilterQuery(params)}`)

export const fetchLeadById = (id) => apiRequest(`/leads/${id}`)

export const createLead = (payload) =>
  apiRequest('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateLead = (id, payload) =>
  apiRequest(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteLead = (id) =>
  apiRequest(`/leads/${id}`, {
    method: 'DELETE',
  })

export const downloadLeadsImportTemplate = async () => {
  const response = await fetch(`${ApiConfig.baseUrl}/leads/import/template`)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Erro ao baixar modelo')
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'modelo-importacao-leads.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const importLeads = async (file, rule) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('rule', rule)
  const response = await fetch(`${ApiConfig.baseUrl}/leads/import`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Erro na importação')
  }
  return data
}
