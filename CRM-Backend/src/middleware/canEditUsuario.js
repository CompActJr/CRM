import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'

export const canEditUsuario = async (request, response, next) => {
  try {
    const rawRequesterId = request.headers['x-usuario-id']
    const requesterId = Number(rawRequesterId)
    const targetId = Number(request.params.id)

    if (!rawRequesterId || Number.isNaN(requesterId) || requesterId < 1) {
      const error = new Error(ErrorMessages.accessDenied)
      error.statusCode = 403
      throw error
    }

    const requester = await prisma.usuario.findUnique({
      where: { id: requesterId },
      select: { id: true, perfilAcesso: true },
    })

    if (!requester) {
      const error = new Error(ErrorMessages.accessDenied)
      error.statusCode = 403
      throw error
    }

    const isAdmin = requester.perfilAcesso === 'Administrador'
    const isSelf = requester.id === targetId

    if (!isAdmin && !isSelf) {
      const error = new Error('Você não possui permissão para alterar os dados deste usuário.')
      error.statusCode = 403
      throw error
    }

    request.requester = requester
    request.isAdmin = isAdmin
    request.isSelf = isSelf

    next()
  } catch (error) {
    next(error)
  }
}
