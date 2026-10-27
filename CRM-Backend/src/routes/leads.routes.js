import { Router } from 'express'
import * as interacoesController from '../controllers/interacoes.controller.js'
import * as tarefasController from '../controllers/tarefas.controller.js'
import * as timelineController from '../controllers/timeline.controller.js'
import * as leadsController from '../controllers/leads.controller.js'
import { uploadSpreadsheet } from '../middleware/uploadSpreadsheet.js'

const leadsRoutes = Router()

leadsRoutes.get('/import/template', leadsController.downloadImportTemplate)
leadsRoutes.post('/import', uploadSpreadsheet.single('file'), leadsController.importSpreadsheet)
leadsRoutes.get('/', leadsController.list)
leadsRoutes.get('/:leadId/interacoes', interacoesController.listByLead)
leadsRoutes.post('/:leadId/interacoes', interacoesController.createForLead)
leadsRoutes.get('/:leadId/tarefas', tarefasController.listByLead)
leadsRoutes.post('/:leadId/tarefas', tarefasController.createForLead)
leadsRoutes.get('/:leadId/timeline', timelineController.listByLead)
leadsRoutes.get('/:id', leadsController.getById)
leadsRoutes.post('/', leadsController.create)
leadsRoutes.put('/:id', leadsController.update)
leadsRoutes.delete('/:id', leadsController.remove)

export default leadsRoutes
