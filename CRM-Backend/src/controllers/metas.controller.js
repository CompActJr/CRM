import * as metasService from '../services/metas.service.js'

export const getDashboardStats = async (request, response, next) => {
  try {
    const stats = await metasService.getMetasDashboardStats(request.query)
    response.json(stats)
  } catch (error) {
    next(error)
  }
}

export const getContribuicoes = async (request, response, next) => {
  try {
    const { usuarioId, tipoMeta, dataInicio, dataFim } = request.query
    const contribuicoes = await metasService.getMetasContribuicoes({
      usuarioId,
      tipoMeta,
      dataInicio,
      dataFim,
    })
    response.json(contribuicoes)
  } catch (error) {
    next(error)
  }
}

