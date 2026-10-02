import * as propostasService from '../services/propostas.service.js'

export const listByNegocio = async (request, response, next) => {
  try {
    const propostas = await propostasService.listPropostasByNegocio(request.params.negocioId)
    response.json(propostas)
  } catch (error) {
    next(error)
  }
}

export const create = async (request, response, next) => {
  try {
    const proposta = await propostasService.createProposta(
      request.params.negocioId,
      request.body
    )
    response.status(201).json(proposta)
  } catch (error) {
    next(error)
  }
}

export const update = async (request, response, next) => {
  try {
    const proposta = await propostasService.updateProposta(request.params.id, request.body)
    response.json(proposta)
  } catch (error) {
    next(error)
  }
}

export const remove = async (request, response, next) => {
  try {
    await propostasService.deleteProposta(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const downloadPdf = async (request, response, next) => {
  try {
    const { buffer, filename } = await propostasService.exportPropostaPdf(request.params.id)
    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    response.send(buffer)
  } catch (error) {
    next(error)
  }
}
