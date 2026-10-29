import * as relatoriosService from '../services/relatorios.service.js'

export const gerar = async (request, response, next) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    const relatorio = await relatoriosService.gerarRelatorio(request.query)
    response.json(relatorio)
  } catch (error) {
    next(error)
  }
}

export const opcoes = async (request, response, next) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    response.json(await relatoriosService.obterOpcoesRelatorio())
  } catch (error) {
    next(error)
  }
}

const sendExport = async (request, response, next, format) => {
  try {
    const isExcel = format === 'excel'
    const buffer = isExcel
      ? await relatoriosService.exportarRelatorioExcel(request.query)
      : await relatoriosService.exportarRelatorioPdf(request.query)
    response.setHeader(
      'Content-Type',
      isExcel
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    )
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-crm.${isExcel ? 'xlsx' : 'pdf'}"`
    )
    response.send(Buffer.from(buffer))
  } catch (error) {
    next(error)
  }
}

export const exportar = (request, response, next) => sendExport(request, response, next, 'pdf')
export const exportarExcel = (request, response, next) => sendExport(request, response, next, 'excel')
