import { Router } from 'express'
import * as dashboardController from '../controllers/dashboard.controller.js'

const dashboardRoutes = Router()

dashboardRoutes.get('/', dashboardController.getStats)
dashboardRoutes.get('/atividades', dashboardController.getAtividades)

export default dashboardRoutes
