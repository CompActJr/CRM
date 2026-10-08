import * as negociosService from '../services/negocios.service.js'

export const list = async (request, response, next) => {
  try {
    const negocios = await negociosService.listNegocios(request.query)
    response.json(negocios)
  } catch (error) {
    next(error)
  }
}

export const listFunil = async (request, response, next) => {
  try {
    const funil = await negociosService.listNegociosFunil(request.query)
    response.json(funil)
  } catch (error) {
    next(error)
  }
}

export const getById = async (request, response, next) => {
  try {
    const negocio = await negociosService.getNegocioById(request.params.id)
    response.json(negocio)
  } catch (error) {
    next(error)
  }
}

export const create = async (request, response, next) => {
  try {
    const negocio = await negociosService.createNegocio(request.body)
    response.status(201).json(negocio)
  } catch (error) {
    next(error)
  }
}

export const update = async (request, response, next) => {
  try {
    const negocio = await negociosService.updateNegocio(request.params.id, request.body)
    response.json(negocio)
  } catch (error) {
    next(error)
  }
}

export const remove = async (request, response, next) => {
  try {
    await negociosService.deleteNegocio(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const marcarPerdida = async (request, response, next) => {
  try {
    const negocio = await negociosService.marcarNegocioComoPerdida(
      request.params.id,
      request.body
    )
    response.json(negocio)
  } catch (error) {
    next(error)
  }
}
