const USE_MOCK = true

const MOCK_DATA = {
  totalLeads: 128,
  leadsAtivos: 96,
  leadsInativos: 32,
  ativosPercentual: 75,
  passivosPercentual: 25,
  oportunidadesAbertas: 24,
  emNegociacao: 12,
  taxaConversao: 38.5,
  negociosEmAndamento: {
    valor: 'R$ 340.000,00',
    quantidade: 24,
  },
  meses: 6,
  leadsPorMes: [
    { label: 'Out', count: 12, height: 40 },
    { label: 'Nov', count: 18, height: 60 },
    { label: 'Dez', count: 8, height: 25 },
    { label: 'Jan', count: 24, height: 80 },
    { label: 'Fev', count: 30, height: 100 },
    { label: 'Mar', count: 15, height: 50 },
  ],
}

export async function fetchDashboardStats(params = 6) {
  const meses = typeof params === 'object' ? params.meses : params
  const dataInicio = typeof params === 'object' ? params.dataInicio : null
  const dataFim = typeof params === 'object' ? params.dataFim : null

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    if (meses === 0.25) {
      return {
        ...MOCK_DATA,
        totalLeads: 14,
        leadsAtivos: 10,
        leadsInativos: 4,
        meses: 0.25,
        leadsPorMes: [
          { label: 'Seg', count: 2, height: 40 },
          { label: 'Ter', count: 3, height: 60 },
          { label: 'Qua', count: 1, height: 20 },
          { label: 'Qui', count: 4, height: 80 },
          { label: 'Sex', count: 3, height: 60 },
          { label: 'Sáb', count: 0, height: 0 },
          { label: 'Dom', count: 1, height: 20 },
        ],
      }
    }

    if (meses === 'custom') {
      return {
        ...MOCK_DATA,
        meses: 'custom',
        leadsPorMes: [
          { label: dataInicio || 'Início', count: 5, height: 30 },
          { label: 'Período', count: 12, height: 70 },
          { label: dataFim || 'Fim', count: 8, height: 50 },
        ],
      }
    }

    return { ...MOCK_DATA, meses }
  }

  let url = 'http://localhost:3333/api/dashboard?'
  if (meses === 'custom') {
    url += `dataInicio=${dataInicio}&dataFim=${dataFim}`
  } else {
    url += `meses=${meses}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Falha ao carregar os dados do dashboard')
  }

  return response.json()
}
