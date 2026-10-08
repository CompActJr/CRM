import { formatDateBr } from './date.js'
import { mapNegocioToResponse } from './negocioMapper.js'

export const mapLeadToResponse = (lead) => ({
  id: lead.id,
  nome: lead.nome,
  email: lead.email,
  telefone: lead.telefone,
  empresa: lead.empresa,
  cidade: lead.cidade,
  nicho: lead.nicho,
  observacoes: lead.observacoes,
  status: lead.status,
  dataCadastro: formatDateBr(lead.dataCadastro),
  usuarioId: lead.usuarioId,
  responsavel: lead.usuario?.nome ?? null,
})

export const leadIncludeUsuario = {
  usuario: { select: { id: true, nome: true } },
}

export const leadIncludeDetail = {
  usuario: { select: { id: true, nome: true } },
  negocios: {
    include: {
      responsaveis: { select: { id: true, nome: true, avatarUrl: true } },
      lead: { select: { id: true, nome: true, empresa: true } },
      etapaFunil: { select: { id: true, nome: true, ordem: true } },
    },
    orderBy: { dataCriacao: 'desc' },
  },
}

export const mapLeadDetailToResponse = (lead) => ({
  ...mapLeadToResponse(lead),
  negocios: (lead.negocios ?? []).map(mapNegocioToResponse),
})
