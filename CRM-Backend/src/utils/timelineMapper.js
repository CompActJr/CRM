import { formatCurrencyBr } from './currency.js'
import { formatDateBr, formatDateTimeBr } from './date.js'
import { InteracaoTipoLabels, interacaoInclude } from './interacaoMapper.js'
import { PropostaStatusLabels, propostaInclude } from './propostaMapper.js'
import { TarefaStatusLabels, tarefaInclude } from './tarefaMapper.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export const timelineEtapaInclude = {
  etapaFunil: { select: { nome: true } },
  negocio: { select: { id: true, titulo: true } },
}

export const timelineNegocioSelect = {
  id: true,
  titulo: true,
  dataCriacao: true,
  etapaFunil: { select: { nome: true } },
}

export const timelineInteracaoInclude = interacaoInclude

export const timelineTarefaInclude = tarefaInclude

export const timelinePropostaInclude = {
  ...propostaInclude,
  negocio: { select: { id: true, titulo: true } },
}

export const timelineLeadResponsavelInclude = {
  usuario: { select: { id: true, nome: true } },
}

export const timelineNegocioResponsavelInclude = {
  usuario: { select: { id: true, nome: true } },
  negocio: { select: { id: true, titulo: true } },
}

export const buildInteracaoEvento = (interacao) => ({
  id: `interacao-${interacao.id}`,
  tipo: 'interacao',
  tipoLabel: 'Interação',
  evento: InteracaoTipoLabels[interacao.tipo] ?? interacao.tipo,
  descricao: interacao.descricao,
  detalhe: null,
  data: interacao.dataInteracao.toISOString(),
  dataFormatada: formatDateTimeBr(interacao.dataInteracao),
  responsavel: interacao.usuario?.nome ?? null,
  responsavelId: interacao.usuarioId ?? null,
  negocioId: interacao.negocioId,
  negocioTitulo: interacao.negocio?.titulo ?? null,
})

export const buildTarefaEventos = (tarefa) => {
  const eventoBase = {
    tipo: 'tarefa',
    tipoLabel: 'Tarefa',
    descricao: tarefa.titulo,
    responsavel: tarefa.usuario?.nome ?? null,
    responsavelId: tarefa.usuarioId ?? null,
    negocioId: tarefa.negocioId,
    negocioTitulo: tarefa.negocio?.titulo ?? null,
  }

  const eventos = [
    {
      ...eventoBase,
      id: `tarefa-${tarefa.id}-criada`,
      evento: 'Tarefa criada',
      detalhe: `Prazo: ${formatDateBr(tarefa.dataPrazo)} · ${
        TarefaStatusLabels[tarefa.status] ?? tarefa.status
      }`,
      data: tarefa.createdAt.toISOString(),
      dataFormatada: formatDateTimeBr(tarefa.createdAt),
    },
  ]

  if (tarefa.status === 'Concluida') {
    // A tarefa não guarda a data de conclusão; a última atualização é o melhor indício disponível.
    eventos.push({
      ...eventoBase,
      id: `tarefa-${tarefa.id}-concluida`,
      evento: 'Tarefa concluída',
      detalhe: `Prazo: ${formatDateBr(tarefa.dataPrazo)}`,
      data: tarefa.updatedAt.toISOString(),
      dataFormatada: formatDateTimeBr(tarefa.updatedAt),
    })
  }

  return eventos
}

export const buildEtapaEvento = (registro) => {
  const detalhe = registro.saidaEm
    ? `Permaneceu ${Math.max(
        0,
        Math.floor((registro.saidaEm.getTime() - registro.entradaEm.getTime()) / MS_PER_DAY)
      )} dia(s)`
    : 'Etapa atual'

  return {
    id: `etapa-${registro.id}`,
    tipo: 'etapa',
    tipoLabel: 'Funil',
    evento: `Entrada na etapa ${registro.etapaFunil.nome}`,
    descricao: null,
    detalhe,
    data: registro.entradaEm.toISOString(),
    dataFormatada: formatDateTimeBr(registro.entradaEm),
    responsavel: null,
    responsavelId: null,
    negocioId: registro.negocioId,
    negocioTitulo: registro.negocio?.titulo ?? null,
  }
}

export const buildPropostaEvento = (proposta) => ({
  id: `proposta-${proposta.id}`,
  tipo: 'proposta',
  tipoLabel: 'Proposta',
  evento: 'Proposta registrada',
  descricao: proposta.titulo,
  detalhe: `${PropostaStatusLabels[proposta.status] ?? proposta.status} · ${formatCurrencyBr(
    proposta.valor
  )}`,
  data: proposta.dataProposta.toISOString(),
  dataFormatada: formatDateBr(proposta.dataProposta),
  responsavel: proposta.usuario?.nome ?? null,
  responsavelId: proposta.usuarioId ?? null,
  negocioId: proposta.negocioId,
  negocioTitulo: proposta.negocio?.titulo ?? null,
})

export const buildNegocioEvento = (negocio, etapaInicial) => {
  const etapa = etapaInicial ?? negocio.etapaFunil?.nome

  return {
    id: `negocio-${negocio.id}`,
    tipo: 'negocio',
    tipoLabel: 'Negócio',
    evento: 'Negócio criado',
    descricao: negocio.titulo,
    detalhe: etapa ? `Etapa inicial: ${etapa}` : null,
    data: negocio.dataCriacao.toISOString(),
    dataFormatada: formatDateTimeBr(negocio.dataCriacao),
    responsavel: null,
    responsavelId: null,
    negocioId: negocio.id,
    negocioTitulo: negocio.titulo,
  }
}

/** Primeira etapa registrada no histórico de cada negócio (a etapa atual pode ter mudado). */
export const mapPrimeiraEtapaPorNegocio = (historicoEtapas) => {
  const mapa = new Map()
  // o histórico chega em ordem decrescente de entrada; a última ocorrência é a mais antiga
  for (const registro of historicoEtapas) {
    mapa.set(registro.negocioId, registro.etapaFunil?.nome ?? null)
  }
  return mapa
}

export const sortEventosTimeline = (eventos) =>
  eventos.sort((a, b) => {
    const diff = new Date(b.data).getTime() - new Date(a.data).getTime()
    return diff !== 0 ? diff : a.id.localeCompare(b.id)
  })

export const buildResponsavelEventos = (registro, escopo) => {
  const alvo = escopo === 'negocio' ? 'negócio' : 'lead'
  const base = {
    tipo: 'responsavel',
    tipoLabel: 'Responsável',
    descricao: registro.usuario?.nome ?? 'Usuário removido',
    responsavel: null,
    responsavelId: registro.usuarioId ?? null,
    negocioId: escopo === 'negocio' ? registro.negocioId : null,
    negocioTitulo: registro.negocio?.titulo ?? null,
  }

  const eventos = [
    {
      ...base,
      id: `responsavel-${escopo}-${registro.id}-entrada`,
      evento: `Passou a ser responsável pelo ${alvo}`,
      detalhe: null,
      data: registro.entradaEm.toISOString(),
      dataFormatada: formatDateTimeBr(registro.entradaEm),
    },
  ]

  if (registro.saidaEm) {
    eventos.push({
      ...base,
      id: `responsavel-${escopo}-${registro.id}-saida`,
      evento: `Deixou de ser responsável pelo ${alvo}`,
      detalhe: null,
      data: registro.saidaEm.toISOString(),
      dataFormatada: formatDateTimeBr(registro.saidaEm),
    })
  }

  return eventos
}

const responsaveisNoInstante = (registros, instante) => {
  const alvo = new Date(instante).getTime()

  return registros
    .filter((registro) => {
      const entrada = new Date(registro.entradaEm).getTime()
      const saida = registro.saidaEm ? new Date(registro.saidaEm).getTime() : null
      return entrada <= alvo && (saida === null || saida > alvo)
    })
    .map((registro) => ({ id: registro.usuarioId, nome: registro.usuario?.nome ?? null }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'))
}

/**
 * Anexa a cada evento quem eram os responsáveis no exato momento em que ele ocorreu:
 * eventos de negócio usam o histórico do negócio, os demais usam o histórico do lead.
 */
export const aplicarResponsaveisNaTimeline = (
  eventos,
  { historicoLead = [], historicoNegocio = [] }
) => {
  const porNegocio = new Map()
  for (const registro of historicoNegocio) {
    if (!porNegocio.has(registro.negocioId)) porNegocio.set(registro.negocioId, [])
    porNegocio.get(registro.negocioId).push(registro)
  }

  return eventos.map((evento) => {
    const temNegocio = Boolean(evento.negocioId)
    return {
      ...evento,
      escopo: temNegocio ? 'negocio' : 'lead',
      responsaveis: temNegocio
        ? responsaveisNoInstante(porNegocio.get(evento.negocioId) ?? [], evento.data)
        : responsaveisNoInstante(historicoLead, evento.data),
    }
  })
}