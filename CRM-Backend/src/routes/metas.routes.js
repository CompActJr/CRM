import { Router } from 'express'
import * as metasController from '../controllers/metas.controller.js'

const metasRoutes = Router()

metasRoutes.get('/dashboard', metasController.getDashboardStats)
metasRoutes.get('/contribuicoes', metasController.getContribuicoes)

export default metasRoutes

