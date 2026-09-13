import bcrypt from 'bcryptjs'
import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { assertCargoAtivo } from './cargos.service.js'
import { mapUsuarioToResponse, parsePerfilAcesso } from '../utils/usuarioMapper.js'
import { deleteAvatarFromSupabase, uploadAvatarToSupabase } from '../lib/supabaseStorage.js'

const parseUsuarioId = (id) => {
  const parsed = Number(id)
  if (!id || Number.isNaN(parsed) || parsed < 1) return null
  return parsed
}

const buildUsuarioData = async (
  body,
  {
    isUpdate = false,
    existingCargo = null,
    existingPerfil = null,
    isSelf = false,
    isAdmin = false,
  } = {}
) => {
  const nome = body.nome?.trim()
  if (!nome) {
    const error = new Error(ErrorMessages.usuarioNomeRequired)
    error.statusCode = 400
    throw error
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    const error = new Error(ErrorMessages.usuarioEmailRequired)
    error.statusCode = 400
    throw error
  }

  const cargo = body.cargo?.trim() || existingCargo
  if (!cargo) {
    const error = new Error(ErrorMessages.usuarioCargoRequired)
    error.statusCode = 400
    throw error
  }

  await assertCargoAtivo(cargo, existingCargo)

  let perfilAcesso = parsePerfilAcesso(body.perfilAcesso ?? body.perfil)
  if (!perfilAcesso) {
    if (isUpdate && existingPerfil) {
      perfilAcesso = existingPerfil
    } else {
      const error = new Error(ErrorMessages.invalidPerfilAcesso)
      error.statusCode = 400
      throw error
    }
  }

  // Usuários não-administradores não podem elevar seus próprios privilégios
  if (isUpdate && !isAdmin && existingPerfil) {
    perfilAcesso = existingPerfil
  }

  const data = { nome, email, cargo, perfilAcesso }

  if (body.avatarUrl !== undefined) {
    data.avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null
  }

  const senha = body.senha?.trim()
  if (senha) {
    data.senha = await bcrypt.hash(senha, 10)
  } else if (!isUpdate) {
    const error = new Error(ErrorMessages.usuarioSenhaRequired)
    error.statusCode = 400
    throw error
  }

  return data
}

const ensureEmailAvailable = async (email, usuarioId = null) => {
  const existing = await prisma.usuario.findUnique({ where: { email } })
  if (existing && existing.id !== usuarioId) {
    const error = new Error(ErrorMessages.usuarioEmailInUse)
    error.statusCode = 409
    throw error
  }
}

export const listUsuarios = async () => {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
  })
  return usuarios.map(mapUsuarioToResponse)
}

export const listUsuariosOpcoes = async () => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, avatarUrl: true },
    orderBy: { nome: 'asc' },
  })
  return usuarios
}

export const getUsuarioById = async (idParam) => {
  const id = parseUsuarioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidUsuarioIdParam)
    error.statusCode = 400
    throw error
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 404
    throw error
  }

  return mapUsuarioToResponse(usuario)
}

export const createUsuario = async (body) => {
  const data = await buildUsuarioData(body)
  await ensureEmailAvailable(data.email)
  const usuario = await prisma.usuario.create({ data })
  return mapUsuarioToResponse(usuario)
}

export const updateUsuario = async (idParam, body, { isSelf = false, isAdmin = false } = {}) => {
  const id = parseUsuarioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidUsuarioIdParam)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.usuario.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 404
    throw error
  }

  const data = await buildUsuarioData(body, {
    isUpdate: true,
    existingCargo: existing.cargo,
    existingPerfil: existing.perfilAcesso,
    isSelf,
    isAdmin,
  })
  await ensureEmailAvailable(data.email, id)

  if (!data.senha) {
    delete data.senha
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
  })
  return mapUsuarioToResponse(usuario)
}

export const updateUsuarioAvatar = async (idParam, file) => {
  const id = parseUsuarioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidUsuarioIdParam)
    error.statusCode = 400
    throw error
  }

  if (!file || !file.buffer) {
    const error = new Error('Arquivo de imagem não fornecido.')
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.usuario.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 404
    throw error
  }

  const extension = file.originalname?.split('.').pop() || 'png'
  const filename = `avatar-u${existing.id}-${Date.now()}.${extension}`

  const publicUrl = await uploadAvatarToSupabase(file.buffer, filename, file.mimetype)

  if (existing.avatarUrl) {
    await deleteAvatarFromSupabase(existing.avatarUrl)
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: { avatarUrl: publicUrl },
  })

  return mapUsuarioToResponse(updated)
}

export const deleteUsuarioAvatar = async (idParam) => {
  const id = parseUsuarioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidUsuarioIdParam)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.usuario.findUnique({ where: { id } })
  if (!existing) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 404
    throw error
  }

  if (existing.avatarUrl) {
    await deleteAvatarFromSupabase(existing.avatarUrl)
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: { avatarUrl: null },
  })

  return mapUsuarioToResponse(updated)
}

export const deleteUsuario = async (idParam) => {
  const id = parseUsuarioId(idParam)
  if (!id) {
    const error = new Error(ErrorMessages.invalidUsuarioIdParam)
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.usuario.findUnique({
    where: { id },
    include: {
      leads: { select: { id: true }, take: 1 },
      oportunidades: { select: { id: true }, take: 1 },
    },
  })

  if (!existing) {
    const error = new Error(ErrorMessages.usuarioNotFound)
    error.statusCode = 404
    throw error
  }

  if (existing.leads.length > 0) {
    const error = new Error(ErrorMessages.usuarioHasLeads)
    error.statusCode = 409
    throw error
  }

  if (existing.oportunidades.length > 0) {
    const error = new Error(ErrorMessages.usuarioHasOportunidades)
    error.statusCode = 409
    throw error
  }

  if (existing.avatarUrl) {
    await deleteAvatarFromSupabase(existing.avatarUrl)
  }

  await prisma.usuario.delete({ where: { id } })
}
