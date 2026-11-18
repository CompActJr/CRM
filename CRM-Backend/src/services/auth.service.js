import bcrypt from 'bcryptjs'
import { ErrorMessages } from '../config/constants.js'
import prisma from '../lib/prisma.js'

export const login = async ({ email, senha }) => {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) {
    const error = new Error(ErrorMessages.emailRequired)
    error.statusCode = 400
    throw error
  }
  if (!senha) {
    const error = new Error(ErrorMessages.senhaRequired)
    error.statusCode = 400
    throw error
  }

  const usuario = await prisma.usuario.findFirst({
    where: { email: normalizedEmail, ativo: true },
    select: { id: true, nome: true, email: true, cargo: true, perfilAcesso: true, avatarUrl: true, senha: true },
  })

  if (!usuario) {
    const error = new Error(ErrorMessages.invalidCredentials)
    error.statusCode = 401
    throw error
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha)
  if (!senhaValida) {
    const error = new Error(ErrorMessages.invalidCredentials)
    error.statusCode = 401
    throw error
  }

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
    perfilAcesso: usuario.perfilAcesso,
    avatarUrl: usuario.avatarUrl,
  }
}

export const getSessionUsuario = async (usuarioIdParam) => {
  const usuarioId = Number(usuarioIdParam)
  if (!usuarioIdParam || Number.isNaN(usuarioId) || usuarioId < 1) {
    const error = new Error('Sessão inválida')
    error.statusCode = 401
    throw error
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
      perfilAcesso: true,
      avatarUrl: true,
    },
  })

  if (!usuario) {
    const error = new Error('Sessão expirada ou usuário não encontrado')
    error.statusCode = 401
    throw error
  }

  return usuario
}
