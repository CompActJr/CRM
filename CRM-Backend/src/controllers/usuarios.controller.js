import * as usuariosService from '../services/usuarios.service.js'

export const listOpcoes = async (_request, response, next) => {
  try {
    const usuarios = await usuariosService.listUsuariosOpcoes()
    response.json(usuarios)
  } catch (error) {
    next(error)
  }
}

export const list = async (_request, response, next) => {
  try {
    const usuarios = await usuariosService.listUsuarios()
    response.json(usuarios)
  } catch (error) {
    next(error)
  }
}

export const getById = async (request, response, next) => {
  try {
    const usuario = await usuariosService.getUsuarioById(request.params.id)
    response.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const create = async (request, response, next) => {
  try {
    const usuario = await usuariosService.createUsuario(request.body)
    response.status(201).json(usuario)
  } catch (error) {
    next(error)
  }
}

export const update = async (request, response, next) => {
  try {
    const usuario = await usuariosService.updateUsuario(request.params.id, request.body, {
      isSelf: request.isSelf,
      isAdmin: request.isAdmin,
    })
    response.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const uploadAvatar = async (request, response, next) => {
  try {
    const usuario = await usuariosService.updateUsuarioAvatar(request.params.id, request.file)
    response.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const removeAvatar = async (request, response, next) => {
  try {
    const usuario = await usuariosService.deleteUsuarioAvatar(request.params.id)
    response.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const remove = async (request, response, next) => {
  try {
    await usuariosService.deleteUsuario(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
