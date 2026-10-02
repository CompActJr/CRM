import * as interacoesService from '../services/interacoes.service.js'

export const listByLead = async (request, response, next) => {
  try {
    const interacoes = await interacoesService.listInteracoesByLead(
      request.params.leadId,
      request.query
    )
    response.json(interacoes)
  } catch (error) {
    next(error)
  }
}

export const createForLead = async (request, response, next) => {
  try {
    const interacao = await interacoesService.createInteracaoForLead(
      request.params.leadId,
      request.body
    )
    response.status(201).json(interacao)
  } catch (error) {
    next(error)
  }
}

export const listByNegocio = async (request, response, next) => {
  try {
    const interacoes = await interacoesService.listInteracoesByNegocio(
      request.params.negocioId
    )
    response.json(interacoes)
  } catch (error) {
    next(error)
  }
}

export const createForNegocio = async (request, response, next) => {
  try {
    const interacao = await interacoesService.createInteracaoForNegocio(
      request.params.negocioId,
      request.body
    )
    response.status(201).json(interacao)
  } catch (error) {
    next(error)
  }
}

export const update = async (request, response, next) => {
  try {
    const interacao = await interacoesService.updateInteracao(request.params.id, request.body)
    response.json(interacao)
  } catch (error) {
    next(error)
  }
}

export const remove = async (request, response, next) => {
  try {
    await interacoesService.deleteInteracao(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
