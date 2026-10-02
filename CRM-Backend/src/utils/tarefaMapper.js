import { formatDateBr } from './date.js'

const TarefaStatusLabels = {
  Pendente: 'Pendente',
  Concluida: 'Concluída',
}

export const TarefaStatusValidos = Object.keys(TarefaStatusLabels)

export const tarefaInclude = {
  usuario: { select: { id: true, nome: true } },
  negocio: { select: { id: true, titulo: true } },
}

export const mapTarefaToResponse = (tarefa) => ({
  id: tarefa.id,
  titulo: tarefa.titulo,
  descricao: tarefa.descricao,
  dataPrazo: formatDateBr(tarefa.dataPrazo),
  status: TarefaStatusLabels[tarefa.status] ?? tarefa.status,
  statusDb: tarefa.status,
  leadId: tarefa.leadId,
  negocioId: tarefa.negocioId,
  negocioTitulo: tarefa.negocio?.titulo ?? null,
  usuarioId: tarefa.usuarioId,
  responsavel: tarefa.usuario?.nome ?? null,
  atrasada:
    tarefa.status === 'Pendente' &&
    new Date(tarefa.dataPrazo).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0),
})
