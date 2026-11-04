import * as leadsImportService from '../services/leadsImport.service.js'
import * as leadsService from '../services/leads.service.js'

export const list = async (request, response, next) => {
  try {
    const leads = await leadsService.listLeads(request.query)
    response.json(leads)
  } catch (error) {
    next(error)
  }
}

export const getById = async (request, response, next) => {
  try {
    const lead = await leadsService.getLeadById(request.params.id)
    response.json(lead)
  } catch (error) {
    next(error)
  }
}

export const create = async (request, response, next) => {
  try {
    const lead = await leadsService.createLead(request.body)
    response.status(201).json(lead)
  } catch (error) {
    next(error)
  }
}

export const update = async (request, response, next) => {
  try {
    const lead = await leadsService.updateLead(request.params.id, request.body)
    response.json(lead)
  } catch (error) {
    next(error)
  }
}

export const remove = async (request, response, next) => {
  try {
    await leadsService.deleteLead(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const mudarEtapa = async (request, response, next) => {
  try {
    const lead = await leadsService.mudarEtapaLead(
      request.params.id,
      request.body,
      request.headers['x-usuario-id']
    )
    response.json(lead)
  } catch (error) {
    next(error)
  }
}

export const downloadImportTemplate = async (_request, response, next) => {
  try {
    const buffer = await leadsImportService.getImportTemplate()
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response.setHeader('Content-Disposition', 'attachment; filename="modelo-importacao-leads.xlsx"')
    response.send(Buffer.from(buffer))
  } catch (error) {
    next(error)
  }
}

export const importSpreadsheet = async (request, response, next) => {
  try {
    const summary = await leadsImportService.importLeadsFromFile(request.file, request.body.rule)
    response.json(summary)
  } catch (error) {
    next(error)
  }
}
