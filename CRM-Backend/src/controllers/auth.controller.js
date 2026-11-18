import * as authService from '../services/auth.service.js'

export const login = async (request, response, next) => {
  try {
    const usuario = await authService.login(request.body)
    response.json({ usuario })
  } catch (error) {
    next(error)
  }
}

export const me = async (request, response, next) => {
  try {
    const usuario = await authService.getSessionUsuario(request.headers['x-usuario-id'])
    response.json({ usuario })
  } catch (error) {
    next(error)
  }
}
