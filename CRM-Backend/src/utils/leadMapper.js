import { formatDateBr } from './date.js'
import { mapNegocioToResponse } from './negocioMapper.js'

export const mapLeadToResponse = (lead) => {
  const responsaveis = lead.responsaveis && lead.responsaveis.length > 0
    ? lead.responsaveis
    : lead.usuario ? [{ id: lead.usuario.id, nome: lead.usuario.nome, avatarUrl: lead.usuario.avatarUrl ?? null }] : []
  const responsaveisIds = responsaveis.map((r) => r.id)
  const primeiroResponsavel = responsaveis[0]

  return {
    id: lead.id,
    cnpj: lead.cnpj,
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    empresa: lead.empresa,
    cidade: lead.cidade,
    nicho: lead.nicho,
    observacoes: lead.observacoes,
    status: lead.status,
    dataCadastro: formatDateBr(lead.dataCadastro),
    usuarioId: lead.usuarioId ?? primeiroResponsavel?.id ?? null,
    responsaveis,
    responsaveisIds,
    primeiroResponsavel,
    responsavel: responsaveis.map((r) => r.nome).join(', ') || lead.usuario?.nome || null,
    etapaFunilId: lead.etapaFunilId ?? null,
    etapa: lead.etapaFunil?.nome ?? null,
    etapaOrdem: lead.etapaFunil?.ordem ?? null,
    motivoPerdaId: lead.motivoPerdaId ?? null,
    motivoPerda: lead.motivoPerda?.nome ?? null,
  }
}

export const leadIncludeUsuario = {
  usuario: { select: { id: true, nome: true } },
  responsaveis: { select: { id: true, nome: true, avatarUrl: true } },
  etapaFunil: { select: { id: true, nome: true, ordem: true } },
  motivoPerda: { select: { id: true, nome: true } },
}

export const leadIncludeDetail = {
  usuario: { select: { id: true, nome: true } },
  responsaveis: { select: { id: true, nome: true, avatarUrl: true } },
  etapaFunil: { select: { id: true, nome: true, ordem: true } },
  motivoPerda: { select: { id: true, nome: true } },
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
