import { Router } from 'express'
import * as relatoriosController from '../controllers/relatorios.controller.js'

const relatoriosRoutes = Router()

relatoriosRoutes.get('/opcoes', relatoriosController.opcoes)
relatoriosRoutes.get('/export/excel', relatoriosController.exportarExcel)
relatoriosRoutes.get('/export/pdf', relatoriosController.exportar)
relatoriosRoutes.get('/', relatoriosController.gerar)
relatoriosRoutes.get('/export', relatoriosController.exportar)

export default relatoriosRoutes
