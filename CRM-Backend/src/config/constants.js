export const Config = {
  get port() {
    return Number(process.env.PORT) || 3333
  },
  portalBj: {
    get email() {
      return process.env.PORTAL_BJ_EMAIL || ''
    },
    get senha() {
      return process.env.PORTAL_BJ_SENHA || ''
    },
    get url() {
      return (
        process.env.PORTAL_BJ_URL ||
        'https://portal.brasiljunior.org.br/ejs/compact-jr-2025/perfil?ejId=compact-jr-2025&year=2026'
      )
    },
    get ano() {
      return Number(process.env.PORTAL_BJ_ANO) || 2026
    },
    get cron() {
      return process.env.PORTAL_BJ_CRON || '0 7,19 * * *'
    },
    get chromiumPath() {
      return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || ''
    },
  },
}

export const NEGOCIO_PERDIDO_INTERACAO_PREFIX = 'Negocio marcada como perdida. Motivo: '

export const EtapasFunilDefault = [
  { nome: 'Mapeamento', ordem: 1 },
  { nome: 'Entrada de Contato', ordem: 2 },
  { nome: 'Diagnóstico', ordem: 3 },
  { nome: 'Proposta', ordem: 4 },
  { nome: 'Negociação', ordem: 5 },
  { nome: 'Pós Venda', ordem: 6 },
]

export const isEtapaPosVenda = (etapa) => {
  if (!etapa) return false
  if (etapa.ordem === 6) return true
  const lower = (etapa.nome || '').toLowerCase()
  return (
    lower.includes('pós venda') ||
    lower.includes('pos venda') ||
    lower.includes('pós-venda') ||
    lower.includes('fechado') ||
    lower.includes('ganho') ||
    lower.includes('vendido')
  )
}

export const ErrorMessages = {
  invalidLeadId: 'ID do lead inválido',
  leadNotFound: 'Lead não encontrado',
  cnpjInUse: 'CNPJ já cadastrado para outro lead',
  invalidUsuarioId: 'ID do usuário responsável inválido',
  usuarioNotFound: 'Usuário responsável não encontrado',
  responsaveisRequired: 'Pelo menos um responsável deve ser informado',
  responsaveisNotFound: 'Um ou mais responsáveis informados não foram encontrados',
  nomeRequired: 'Nome é obrigatório',
  dataCadastroRequired: 'Data de cadastro é obrigatória',
  invalidDataCadastro: 'Data de cadastro inválida',
  invalidDataInicio: 'Data de inicio inválida',
  invalidDataFim: 'Data de fim inválida',
  invalidDataRange: 'Intervalo de datas inválido',
  emailRequired: 'Email é obrigatório',
  senhaRequired: 'Senha é obrigatória',
  invalidCredentials: 'Email ou senha inválidos',
  leadHasNegocios: 'Lead possui negocios vinculadas',
  invalidNegocioId: 'ID da negocio inválido',
  negocioNotFound: 'Negocio não encontrada',
  tituloRequired: 'Título é obrigatório',
  invalidLeadIdRef: 'Lead vinculado inválido',
  leadRefNotFound: 'Lead vinculado não encontrado',
  invalidEtapaFunilId: 'Etapa do funil inválida',
  etapaFunilNotFound: 'Etapa do funil não encontrada',
  invalidValorEstimado: 'Valor estimado inválido',
  valorEstimadoRequired: 'Valor estimado é obrigatório e deve ser maior que zero',
  valorEstimadoRequiredForPerda: 'Preencha o valor estimado do negócio antes de marcá-lo como perdido',
  leadEtapaPropostaRequiresNegocio: 'Para avançar para a fase de Proposta ou superior, crie um negócio com valor estimado.',
  invalidUsuarioIdParam: 'ID do usuário inválido',
  usuarioNotFound: 'Usuário não encontrado',
  usuarioNomeRequired: 'Nome é obrigatório',
  usuarioCargoRequired: 'Cargo é obrigatório',
  usuarioEmailRequired: 'Email é obrigatório',
  usuarioEmailInUse: 'Email já cadastrado',
  usuarioSenhaRequired: 'Senha é obrigatória',
  usuarioHasLeads: 'Usuário possui leads vinculados',
  usuarioHasNegocios: 'Usuário possui negocios vinculadas',
  invalidPerfilAcesso: 'Perfil de acesso inválido',
  relatorioDataInicioRequired: 'Data inicial é obrigatória',
  relatorioDataFimRequired: 'Data final é obrigatória',
  relatorioDatasInvalidas: 'Datas do relatório inválidas',
  relatorioPeriodoInvalido: 'Data inicial não pode ser maior que a data final',
  importFileRequired: 'Arquivo da planilha é obrigatório',
  importFileInvalid: 'Formato inválido. Use .xlsx, .xls ou .csv',
  importSheetEmpty: 'Planilha vazia ou sem cabeçalho',
  importColumnNomeRequired: 'Coluna "nome" é obrigatória na planilha',
  importRuleInvalid: 'Regra de importação inválida',
  invalidInteracaoId: 'ID da interação inválido',
  interacaoNotFound: 'Interação não encontrada',
  interacaoTipoRequired: 'Tipo da interação é obrigatório',
  interacaoTipoInvalid: 'Tipo da interação inválido',
  interacaoDescricaoRequired: 'Descrição é obrigatória',
  interacaoDataRequired: 'Data da interação é obrigatória',
  interacaoDataInvalid: 'Data da interação inválida',
  interacaoNegocioInvalid: 'Negocio vinculada inválida',
  interacaoNegocioNotFound: 'Negocio vinculada não encontrada',
  interacaoNegocioLeadMismatch: 'Negocio não pertence a este lead',
  invalidMotivoPerdaId: 'ID do motivo de perda inválido',
  motivoPerdaNotFound: 'Motivo de perda não encontrado',
  motivoPerdaNomeRequired: 'Nome do motivo é obrigatório',
  motivoPerdaNomeInUse: 'Motivo de perda já cadastrado',
  motivoPerdaInUse: 'Motivo vinculado a negocios e não pode ser excluído',
  motivoPerdaRequired: 'Motivo de perda é obrigatório',
  negocioPerdidaNaoEtapa: 'Negócios perdidos são identificados pelo motivo de perda, não por uma etapa do funil',
  invalidCargoId: 'ID do cargo inválido',
  cargoNotFound: 'Cargo não encontrado ou inativo',
  cargoNomeRequired: 'Nome do cargo é obrigatório',
  cargoNomeInUse: 'Cargo já cadastrado',
  cargoInUse: 'Cargo vinculado a usuários e não pode ser excluído',
  negocioJaPerdida: 'Negocio já está marcada como perdida',
  etapaPosVendaNotFound: 'Etapa de Pós Venda / Fechado não configurada no funil',
  valorProjetoRequired: 'Informe o valor do projeto maior que zero',
  negocioNaoEstaEmProposta: 'A conversão antecipada só pode ser realizada na etapa de Proposta',
  negocioJaPerdidaGanho: 'Negócio perdido não pode ser marcado como ganho',
  negocioPosVendaNaoPodeSerPerdido: 'Negócios na etapa de Pós Venda / Fechado não podem ser marcados como perdidos',
  leadPosVendaNaoPodeSerPerdido: 'Leads na etapa de Pós Venda / Fechado não podem ser desqualificados',
  invalidTarefaId: 'ID da tarefa inválido',
  tarefaNotFound: 'Tarefa não encontrada',
  tarefaTituloRequired: 'Título da tarefa é obrigatório',
  tarefaDataPrazoRequired: 'Data de prazo é obrigatória',
  tarefaDataPrazoInvalid: 'Data de prazo inválida',
  tarefaStatusInvalid: 'Status da tarefa inválido',
  tarefaNegocioInvalid: 'Negocio vinculada inválida',
  tarefaNegocioNotFound: 'Negocio vinculada não encontrada',
  tarefaNegocioLeadMismatch: 'Negocio não pertence a este lead',
  invalidPropostaId: 'ID da proposta inválido',
  propostaNotFound: 'Proposta não encontrada',
  propostaTituloRequired: 'Título da proposta é obrigatório',
  propostaValorInvalid: 'Valor da proposta inválido',
  propostaStatusInvalid: 'Status da proposta inválido',
  propostaDataRequired: 'Data da proposta é obrigatória',
  propostaDataInvalid: 'Data da proposta inválida',
  accessDenied: 'Acesso negado',
}
