export const formatPerfilLabel = (perfilAcesso) => {
  return perfilAcesso === 'Usuario' ? 'Usuário' : 'Administrador'
}

export const parsePerfilAcesso = (perfil) => {
  if (perfil === 'Administrador') return 'Administrador'
  if (perfil === 'Usuário' || perfil === 'Usuario') return 'Usuario'
  return null
}

export const mapUsuarioToResponse = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  cargo: usuario.cargo,
  perfilAcesso: usuario.perfilAcesso,
  perfil: formatPerfilLabel(usuario.perfilAcesso),
  avatarUrl: usuario.avatarUrl ?? null,
})
