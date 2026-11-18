import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'

export const requireAdministrador = async (request, response, next) => {
  try {
    const rawId = request.headers['x-usuario-id']
    const usuarioId = Number(rawId)

    if (!rawId || Number.isNaN(usuarioId) || usuarioId < 1) {
      const error = new Error(ErrorMessages.accessDenied)
      error.statusCode = 403
      throw error
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { perfilAcesso: true, ativo: true },
    })

    if (!usuario || !usuario.ativo || usuario.perfilAcesso !== 'Administrador') {
      const error = new Error(ErrorMessages.accessDenied)
      error.statusCode = 403
      throw error
    }

    next()
  } catch (error) {
    next(error)
  }
}
