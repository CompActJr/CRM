import { formatDateTimeBr } from './date.js'

const InteracaoTipoLabels = {
  Ligacao: 'Ligação',
  Email: 'E-mail',
  Reuniao: 'Reunião',
  Nota: 'Nota',
  Registro: 'Registro',
}

export const interacaoInclude = {
  usuario: { select: { id: true, nome: true } },
  negocio: { select: { id: true, titulo: true } },
}

export const mapInteracaoToResponse = (interacao) => ({
  id: interacao.id,
  tipo: InteracaoTipoLabels[interacao.tipo] ?? interacao.tipo,
  tipoDb: interacao.tipo,
  descricao: interacao.descricao,
  dataInteracao: formatDateTimeBr(interacao.dataInteracao),
  leadId: interacao.leadId,
  negocioId: interacao.negocioId,
  negocioTitulo: interacao.negocio?.titulo ?? null,
  usuarioId: interacao.usuarioId,
  responsavel: interacao.usuario?.nome ?? null,
})

export const InteracaoTiposValidos = Object.keys(InteracaoTipoLabels)
