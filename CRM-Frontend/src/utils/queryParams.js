export const buildUsuarioFilterQuery = (usuarioId) => {
  if (!usuarioId) return ''
  return `?usuarioId=${encodeURIComponent(usuarioId)}`
}
export const buildLeadFilterQuery = (params = {}) => {
  const query = new URLSearchParams()

  if (params.nome) query.set('nome', params.nome)
  if (params.empresa) query.set('empresa', params.empresa)
  if (params.usuarioId) query.set('usuarioId', params.usuarioId)
  if (params.cidade) query.set('cidade', params.cidade)
  if (params.nicho) query.set('nicho', params.nicho)
  if (params.status) query.set('status', params.status)

  const queryString = query.toString()

  return queryString ? `?${queryString}` : ''
}