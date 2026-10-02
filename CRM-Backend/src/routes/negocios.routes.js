import { Router } from 'express'
import * as interacoesController from '../controllers/interacoes.controller.js'
import * as tarefasController from '../controllers/tarefas.controller.js'
import * as negociosController from '../controllers/negocios.controller.js'
import * as propostasController from '../controllers/propostas.controller.js'

const negociosRoutes = Router()

negociosRoutes.get('/funil', negociosController.listFunil)
negociosRoutes.get('/', negociosController.list)
negociosRoutes.post('/:id/perder', negociosController.marcarPerdida)
negociosRoutes.get('/:negocioId/interacoes', interacoesController.listByNegocio)
negociosRoutes.post('/:negocioId/interacoes', interacoesController.createForNegocio)
negociosRoutes.get('/:negocioId/tarefas', tarefasController.listByNegocio)
negociosRoutes.post('/:negocioId/tarefas', tarefasController.createForNegocio)
negociosRoutes.get('/:negocioId/propostas', propostasController.listByNegocio)
negociosRoutes.post('/:negocioId/propostas', propostasController.create)
negociosRoutes.get('/:id', negociosController.getById)
negociosRoutes.post('/', negociosController.create)
negociosRoutes.put('/:id', negociosController.update)
negociosRoutes.delete('/:id', negociosController.remove)

export default negociosRoutes
