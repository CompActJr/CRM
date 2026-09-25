import ExcelJS from 'exceljs'

const Styles = {
  titleFill: 'FF1E40AF',
  titleFont: 'FFFFFFFF',
  subtitleFill: 'FFEFF6FF',
  sectionFill: 'FFE2E8F0',
  sectionFont: 'FF1E293B',
  headerFill: 'FFF8FAFC',
  zebraFill: 'FFF8FAFC',
  borderColor: 'FF94A3B8',
  fontName: 'Calibri',
}

const formatDateBr = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const applyBorder = (cell) => {
  cell.border = {
    top: { style: 'thin', color: { argb: Styles.borderColor } },
    left: { style: 'thin', color: { argb: Styles.borderColor } },
    bottom: { style: 'thin', color: { argb: Styles.borderColor } },
    right: { style: 'thin', color: { argb: Styles.borderColor } },
  }
}

const forEachCellInRange = (sheet, rowNumber, fromCol, toCol, callback) => {
  for (let col = fromCol; col <= toCol; col += 1) {
    callback(sheet.getRow(rowNumber).getCell(col), col)
  }
}

const mergeAndStyleRow = (sheet, rowNumber, fromCol, toCol, value, style) => {
  sheet.mergeCells(rowNumber, fromCol, rowNumber, toCol)
  const cell = sheet.getRow(rowNumber).getCell(fromCol)
  cell.value = value
  style(cell)
  forEachCellInRange(sheet, rowNumber, fromCol, toCol, (target) => {
    style(target)
    applyBorder(target)
  })
}

export const buildRelatorioExcelBuffer = async (relatorio) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CRM CompAct.Jr'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Relatório', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
    properties: { defaultRowHeight: 22 },
  })

  sheet.columns = [{ width: 42 }, { width: 24 }, { width: 24 }]

  mergeAndStyleRow(sheet, 1, 1, 3, 'CRM Compact.Jr — Relatório Comercial', (cell) => {
    cell.font = { name: Styles.fontName, bold: true, size: 18, color: { argb: Styles.titleFont } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.titleFill } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  sheet.getRow(1).height = 36

  mergeAndStyleRow(
    sheet,
    2,
    1,
    3,
    `Período: ${formatDateBr(relatorio.periodo.dataInicio)} a ${formatDateBr(relatorio.periodo.dataFim)}`,
    (cell) => {
      cell.font = { name: Styles.fontName, bold: true, size: 11, color: { argb: Styles.sectionFont } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.subtitleFill } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
  )
  sheet.getRow(2).height = 24

  mergeAndStyleRow(
    sheet,
    3,
    1,
    3,
    `Responsável: ${relatorio.responsavel}`,
    (cell) => {
      cell.font = { name: Styles.fontName, bold: true, size: 11, color: { argb: Styles.sectionFont } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.subtitleFill } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
  )
  sheet.getRow(3).height = 24

  sheet.getRow(4).height = 8

  let currentRow = 5

  mergeAndStyleRow(sheet, currentRow, 1, 3, 'Indicadores do período', (cell) => {
    cell.font = { name: Styles.fontName, bold: true, size: 12, color: { argb: Styles.sectionFont } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.sectionFill } }
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
  })
  currentRow += 1

  const indicadoresHeaderRow = sheet.getRow(currentRow)
  indicadoresHeaderRow.getCell(1).value = 'Indicador'
  indicadoresHeaderRow.getCell(2).value = 'Valor'
  sheet.mergeCells(currentRow, 2, currentRow, 3)
  forEachCellInRange(sheet, currentRow, 1, 3, (cell) => {
    cell.font = { name: Styles.fontName, bold: true, size: 11, color: { argb: Styles.sectionFont } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.headerFill } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(cell)
  })
  indicadoresHeaderRow.height = 24
  currentRow += 1

  const indicadores = [
    ['Leads no período', relatorio.leadsNoPeriodo],
    ['Oportunidades criadas no período', relatorio.oportunidadesCriadas],
    ['Oportunidades abertas no período', relatorio.oportunidadesAbertas],
    ['Oportunidades fechadas no período', relatorio.oportunidadesFechadas],
    ['Taxa de conversão', `${relatorio.taxaConversao}%`],
    ['Principal motivo de perda', relatorio.principalMotivoPerda],
  ]

  indicadores.forEach(([label, value], index) => {
    const row = sheet.getRow(currentRow)
    row.getCell(1).value = label
    row.getCell(2).value = value
    sheet.mergeCells(currentRow, 2, currentRow, 3)

    const isZebra = index % 2 === 0
    forEachCellInRange(sheet, currentRow, 1, 3, (cell, col) => {
      cell.font = { name: Styles.fontName, size: 11, color: { argb: Styles.sectionFont } }
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.zebraFill } }
      }
      cell.alignment = {
        horizontal: col === 1 ? 'left' : 'center',
        vertical: 'middle',
        wrapText: col === 1,
      }
      applyBorder(cell)
    })
    row.height = 22
    currentRow += 1
  })

  currentRow += 1

  mergeAndStyleRow(sheet, currentRow, 1, 3, 'Tempo médio por etapa', (cell) => {
    cell.font = { name: Styles.fontName, bold: true, size: 12, color: { argb: Styles.sectionFont } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.sectionFill } }
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
  })
  currentRow += 1

  const etapasHeaderRow = sheet.getRow(currentRow)
  etapasHeaderRow.getCell(1).value = 'Etapa'
  etapasHeaderRow.getCell(2).value = 'Tempo médio (dias)'
  sheet.mergeCells(currentRow, 2, currentRow, 3)
  forEachCellInRange(sheet, currentRow, 1, 3, (cell) => {
    cell.font = { name: Styles.fontName, bold: true, size: 11, color: { argb: Styles.sectionFont } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.headerFill } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(cell)
  })
  etapasHeaderRow.height = 24
  currentRow += 1

  relatorio.tempoMedioPorEtapa.forEach((item, index) => {
    const row = sheet.getRow(currentRow)
    row.getCell(1).value = item.etapa
    row.getCell(2).value = item.diasMedio
    sheet.mergeCells(currentRow, 2, currentRow, 3)

    const isZebra = index % 2 === 0
    forEachCellInRange(sheet, currentRow, 1, 3, (cell, col) => {
      cell.font = { name: Styles.fontName, size: 11, color: { argb: Styles.sectionFont } }
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Styles.zebraFill } }
      }
      cell.alignment = {
        horizontal: col === 1 ? 'left' : 'center',
        vertical: 'middle',
      }
      applyBorder(cell)
    })
    currentRow += 1
  })

  sheet.pageSetup = {
    fitToPage: true,
    fitToWidth: 1,
    orientation: 'portrait',
  }

  return workbook.xlsx.writeBuffer()
}
