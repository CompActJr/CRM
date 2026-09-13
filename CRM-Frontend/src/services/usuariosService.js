import { apiRequest } from './apiClient.js'

export const fetchUsuarios = () => apiRequest('/usuarios')

export const fetchUsuariosOpcoes = () => apiRequest('/usuarios/opcoes')

export const fetchUsuarioById = (id) => apiRequest(`/usuarios/${id}`)

export const createUsuario = (payload) =>
  apiRequest('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateUsuario = (id, payload) =>
  apiRequest(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUsuario = (id) =>
  apiRequest(`/usuarios/${id}`, {
    method: 'DELETE',
  })

export const uploadUsuarioAvatar = (id, file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return apiRequest(`/usuarios/${id}/avatar`, {
    method: 'POST',
    body: formData,
  })
}

export const deleteUsuarioAvatar = (id) =>
  apiRequest(`/usuarios/${id}/avatar`, {
    method: 'DELETE',
  })

