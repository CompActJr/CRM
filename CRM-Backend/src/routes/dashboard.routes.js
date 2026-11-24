import { Router } from 'express'
import * as dashboardController from '../controllers/dashboard.controller.js'
import { requireAdministrador } from '../middleware/requireAdministrador.js'

const dashboardRoutes = Router()

dashboardRoutes.get('/', dashboardController.getStats)
dashboardRoutes.get('/atividades', dashboardController.getAtividades)
dashboardRoutes.get('/termometro-mej', dashboardController.getTermometroMej)
dashboardRoutes.post('/termometro-mej/sync', requireAdministrador, dashboardController.syncTermometroMej)

export default dashboardRoutes
