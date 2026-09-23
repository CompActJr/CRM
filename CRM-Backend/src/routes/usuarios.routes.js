import { Router } from 'express'
import * as usuariosController from '../controllers/usuarios.controller.js'
import { requireAdministrador } from '../middleware/requireAdministrador.js'
import { canEditUsuario } from '../middleware/canEditUsuario.js'
import { uploadAvatarMiddleware } from '../middleware/uploadAvatar.middleware.js'

const usuariosRoutes = Router()

usuariosRoutes.get('/opcoes', usuariosController.listOpcoes)
usuariosRoutes.get('/', requireAdministrador, usuariosController.list)
usuariosRoutes.get('/:id', requireAdministrador, usuariosController.getById)
usuariosRoutes.post('/', requireAdministrador, usuariosController.create)
usuariosRoutes.put('/:id', canEditUsuario, usuariosController.update)
usuariosRoutes.post('/:id/avatar', canEditUsuario, uploadAvatarMiddleware, usuariosController.uploadAvatar)
usuariosRoutes.delete('/:id/avatar', canEditUsuario, usuariosController.removeAvatar)
usuariosRoutes.delete('/:id', requireAdministrador, usuariosController.remove)

export default usuariosRoutes
