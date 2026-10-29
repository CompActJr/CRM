import { ApiConfig } from '../config/api.js'
import { apiRequest } from './apiClient.js'
import { loadSessionUser } from '../utils/authSession.js'

const buildQueryString = (params) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const fetchRelatorio = (params) =>
  apiRequest(`/relatorios${buildQueryString(params)}`, { cache: 'no-store' })

export const fetchRelatorioOpcoes = () => apiRequest('/relatorios/opcoes', { cache: 'no-store' })

const downloadRelatorio = async (params, format) => {
  const sessionUser = loadSessionUser()
  const response = await fetch(`${ApiConfig.baseUrl}/relatorios/export/${format}${buildQueryString(params)}`, {
    headers: sessionUser?.id ? { 'X-Usuario-Id': String(sessionUser.id) } : {},
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Erro ao exportar relatório em ${format.toUpperCase()}`)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-crm.${format === 'excel' ? 'xlsx' : 'pdf'}`
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const downloadRelatorioPdf = (params) => downloadRelatorio(params, 'pdf')
export const downloadRelatorioExcel = (params) => downloadRelatorio(params, 'excel')
