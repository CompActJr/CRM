import * as dashboardService from '../services/dashboard.service.js'

export const getStats = async (request, response, next) => {
  try {
    const stats = await dashboardService.getDashboardStats(request.query)
    response.json(stats)
  } catch (error) {
    next(error)
  }
}

export const getAtividades = async (request, response, next) => {
  try {
    const atividades = await dashboardService.getDashboardAtividades(request.headers['x-usuario-id'])
    response.json(atividades)
  } catch (error) {
    next(error)
  }
}
