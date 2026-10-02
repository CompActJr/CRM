import { formatCurrencyBr } from './currency.js'
import { formatDateBr } from './date.js'

const PropostaStatusLabels = {
  Rascunho: 'Rascunho',
  Enviada: 'Enviada',
  EmNegociacao: 'Em negociação',
  Aceita: 'Aceita',
  Recusada: 'Recusada',
}

export const PropostaStatusValidos = Object.keys(PropostaStatusLabels)

export const propostaInclude = {
  usuario: { select: { id: true, nome: true } },
}

export const propostaPdfInclude = {
  usuario: { select: { id: true, nome: true, email: true, cargo: true } },
  negocio: {
    include: {
      lead: {
        select: { nome: true, empresa: true, email: true, telefone: true, cidade: true },
      },
      etapaFunil: { select: { nome: true } },
      usuario: { select: { nome: true } },
    },
  },
}

export const mapPropostaToResponse = (proposta) => ({
  id: proposta.id,
  titulo: proposta.titulo,
  valor: formatCurrencyBr(proposta.valor),
  valorNumerico: proposta.valor,
  status: PropostaStatusLabels[proposta.status] ?? proposta.status,
  statusDb: proposta.status,
  dataProposta: formatDateBr(proposta.dataProposta),
  observacoes: proposta.observacoes ?? null,
  negocioId: proposta.negocioId,
  usuarioId: proposta.usuarioId,
  responsavel: proposta.usuario?.nome ?? null,
})
