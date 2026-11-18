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
  ativo: usuario.ativo ?? true,
  ativarMetaLeads: Boolean(usuario.ativarMetaLeads),
  ativarMetaEntradasContato: Boolean(usuario.ativarMetaEntradasContato),
  ativarMetaDiagnosticos: Boolean(usuario.ativarMetaDiagnosticos),
  quantidadeLeads: Number(usuario.quantidadeLeads || 0),
  quantidadeEntradasContato: Number(usuario.quantidadeEntradasContato || 0),
  quantidadeDiagnosticos: Number(usuario.quantidadeDiagnosticos || 0),
  metaPeriodoInicio: usuario.metaPeriodoInicio ? usuario.metaPeriodoInicio.toISOString().split('T')[0] : null,
  metaPeriodoFim: usuario.metaPeriodoFim ? usuario.metaPeriodoFim.toISOString().split('T')[0] : null,
})
