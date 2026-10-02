import { formatDateBr } from './date.js'

export const buildTarefaResumo = (pendingDates = []) => {
  if (!pendingDates.length) {
    return {
      tarefasPendentes: 0,
      temTarefaPendente: false,
      prazoMaisProximo: null,
    }
  }

  const nearest = pendingDates.reduce((min, date) => (date < min ? date : min), pendingDates[0])

  return {
    tarefasPendentes: pendingDates.length,
    temTarefaPendente: true,
    prazoMaisProximo: formatDateBr(nearest),
    prazoMaisProximoMs: nearest.getTime(),
  }
}

export const collectLeadPendingDates = (lead) =>
  (lead.tarefas ?? []).map((item) => item.dataPrazo)

export const collectNegocioPendingDates = (negocio) =>
  (negocio.tarefas ?? []).map((item) => item.dataPrazo)

export const sortByPendingTasks = (items, getFallbackMs) =>
  [...items].sort((left, right) => {
    const leftPending = left.tarefasPendentes > 0
    const rightPending = right.tarefasPendentes > 0

    if (leftPending !== rightPending) {
      return leftPending ? -1 : 1
    }

    if (leftPending && rightPending) {
      return left.prazoMaisProximoMs - right.prazoMaisProximoMs
    }

    return getFallbackMs(right) - getFallbackMs(left)
  })
