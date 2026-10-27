import * as timelineService from '../services/timeline.service.js'

export const listByLead = async (request, response, next) => {
  try {
    const eventos = await timelineService.getTimelineByLead(request.params.leadId)
    response.json(eventos)
  } catch (error) {
    next(error)
  }
}

export const listByNegocio = async (request, response, next) => {
  try {
    const eventos = await timelineService.getTimelineByNegocio(request.params.negocioId)
    response.json(eventos)
  } catch (error) {
    next(error)
  }
}
