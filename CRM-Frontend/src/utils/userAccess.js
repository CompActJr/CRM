export const isAdministrador = (user) =>
  user?.perfilAcesso === 'Administrador' || user?.perfil === 'Administrador'

export const adminOnlyScreens = ['usuarios', 'usuarioForm']
