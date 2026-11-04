import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseDateInput } from '../utils/date.js'
import { buildLeadsImportTemplateBuffer, parseSpreadsheetRows } from '../utils/spreadsheet.js'

const ImportRules = {
  upsert: 'upsert',
  create_only: 'create_only',
  update_only: 'update_only',
}

const parseImportRule = (value) => {
  const rule = String(value ?? '').trim()
  if (Object.values(ImportRules).includes(rule)) return rule
  return null
}

const parseStatus = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'inativo') return 'Inativo'
  return 'Ativo'
}

const parseDataCadastro = (value) => {
  if (!value) return new Date()
  const iso = parseDateInput(value)
  if (iso) return iso
  const brMatch = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    return new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T00:00:00`)
  }
  return null
}

const buildUsuarioLookup = (usuarios) => {
  const byEmail = new Map()
  const byNome = new Map()

  for (const usuario of usuarios) {
    byEmail.set(usuario.email.toLowerCase(), usuario.id)
    byNome.set(usuario.nome.trim().toLowerCase(), usuario.id)
  }

  return { byEmail, byNome }
}

const resolveUsuarioId = (row, lookup, defaultUsuarioId) => {
  const responsavel = row.responsavel?.trim()
  if (!responsavel) return defaultUsuarioId

  const lower = responsavel.toLowerCase()
  if (lookup.byEmail.has(lower)) return lookup.byEmail.get(lower)
  if (lookup.byNome.has(lower)) return lookup.byNome.get(lower)

  return null
}

const findExistingLead = async (row) => {
  const email = row.email?.trim()
  if (email) {
    const byEmail = await prisma.lead.findFirst({ where: { email } })
    if (byEmail) return byEmail
  }

  const nome = row.nome?.trim()
  const empresa = row.empresa?.trim()
  if (nome && empresa) {
    const byNomeEmpresa = await prisma.lead.findFirst({ where: { nome, empresa } })
    if (byNomeEmpresa) return byNomeEmpresa
  }

  if (nome) {
    return prisma.lead.findFirst({ where: { nome, empresa: null } })
  }

  return null
}

const mapRowToLeadData = (row, usuarioId) => {
  const nome = row.nome?.trim()
  if (!nome) {
    return { error: 'Nome é obrigatório' }
  }

  const dataCadastro = parseDataCadastro(row.data_cadastro)
  if (!dataCadastro) {
    return { error: 'Data de cadastro inválida' }
  }

  return {
    data: {
      nome,
      email: row.email?.trim() || null,
      telefone: row.telefone?.trim() || null,
      empresa: row.empresa?.trim() || null,
      cidade: row.cidade?.trim() || null,
      nicho: row.nicho?.trim() || null,
      observacoes: row.observacoes?.trim() || null,
      status: parseStatus(row.status),
      dataCadastro,
      usuarioId,
    },
  }
}

export const getImportTemplate = async () => {
  return buildLeadsImportTemplateBuffer()
}

export const importLeadsFromFile = async (file, ruleParam) => {
  if (!file?.buffer) {
    const error = new Error(ErrorMessages.importFileRequired)
    error.statusCode = 400
    throw error
  }

  const rule = parseImportRule(ruleParam)
  if (!rule) {
    const error = new Error(ErrorMessages.importRuleInvalid)
    error.statusCode = 400
    throw error
  }

  const { headers, rows } = await parseSpreadsheetRows(file.buffer, file.originalname)

  if (!headers.nome) {
    const error = new Error(ErrorMessages.importColumnNomeRequired)
    error.statusCode = 400
    throw error
  }

  if (rows.length === 0) {
    const error = new Error(ErrorMessages.importSheetEmpty)
    error.statusCode = 400
    throw error
  }

  const usuarios = await prisma.usuario.findMany({ select: { id: true, nome: true, email: true } })
  if (usuarios.length === 0) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 400
    throw error
  }

  const usuarioLookup = buildUsuarioLookup(usuarios)
  const defaultUsuarioId = usuarios[0].id

  const summary = {
    created: 0,
    updated: 0,
    duplicated: 0,
    errors: 0,
    details: [],
  }

  for (const { line, data: row } of rows) {
    const usuarioId = resolveUsuarioId(row, usuarioLookup, defaultUsuarioId)
    if (!usuarioId) {
      summary.errors += 1
      summary.details.push({ line, message: 'Responsável não encontrado' })
      continue
    }

    const mapped = mapRowToLeadData(row, usuarioId)
    if (mapped.error) {
      summary.errors += 1
      summary.details.push({ line, message: mapped.error })
      continue
    }

    try {
      const existing = await findExistingLead(row)

      if (existing) {
        if (rule === ImportRules.create_only) {
          summary.duplicated += 1
          continue
        }
        await prisma.lead.update({ where: { id: existing.id }, data: mapped.data })
        summary.updated += 1
        continue
      }

      if (rule === ImportRules.update_only) {
        summary.errors += 1
        summary.details.push({ line, message: 'Lead não encontrado para atualização' })
        continue
      }

      const etapaInicial = await prisma.etapaFunil.findFirst({ orderBy: { ordem: 'asc' } })
      const etapaFunilId = etapaInicial ? etapaInicial.id : 1

      const created = await prisma.lead.create({
        data: {
          ...mapped.data,
          etapaFunilId,
        },
      })
      await prisma.leadEtapaHistorico.create({
        data: {
          leadId: created.id,
          etapaFunilId,
          entradaEm: new Date(),
        },
      })
      summary.created += 1
    } catch (importError) {
      summary.errors += 1
      summary.details.push({
        line,
        message: importError.message ?? 'Erro ao processar linha',
      })
    }
  }

  return summary
}
