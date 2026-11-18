import { apiRequest } from './apiClient.js'

export const login = (email, senha) =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })

export const fetchCurrentSession = () => apiRequest('/auth/me')
