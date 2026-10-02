import { formatCurrencyBr } from './currency.js'
import { formatDateBr } from './date.js'
import { formatPrioridadeLabel } from './prioridade.js'

export const negocioInclude = {
  responsaveis: { select: { id: true, nome: true, avatarUrl: true } },
  lead: { select: { id: true, nome: true, empresa: true } },
  etapaFunil: { select: { id: true, nome: true, ordem: true } },
  motivoPerda: { select: { id: true, nome: true } },
}

export const mapNegocioToResponse = (negocio) => {
  const responsaveis = negocio.responsaveis ?? []
  const responsaveisIds = responsaveis.map((r) => r.id)
  const primeiroResponsavel = responsaveis[0]

  return {
    id: negocio.id,
    titulo: negocio.titulo,
    valorEstimado: negocio.valorEstimado,
    valor: formatCurrencyBr(negocio.valorEstimado),
    prioridade: formatPrioridadeLabel(negocio.prioridade),
    prioridadeDb: negocio.prioridade,
    motivoPerdaId: negocio.motivoPerdaId,
    motivoPerda: negocio.motivoPerda?.nome ?? null,
    perdida: Boolean(negocio.motivoPerdaId),
    dataCriacao: formatDateBr(negocio.dataCriacao),
    responsaveis,
    responsaveisIds,
    usuarioId: primeiroResponsavel?.id ?? null,
    responsavel: responsaveis.map((r) => r.nome).join(', ') || null,
    leadId: negocio.leadId,
    etapaFunilId: negocio.etapaFunilId,
    lead: negocio.lead?.empresa ?? negocio.lead?.nome ?? null,
    etapa: negocio.etapaFunil?.nome ?? null,
  }
}
