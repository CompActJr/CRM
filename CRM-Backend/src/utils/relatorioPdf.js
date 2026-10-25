import PDFDocument from 'pdfkit'

const colors = {
  ink: '#172554',
  muted: '#64748b',
  border: '#e2e8f0',
  pale: '#f8fafc',
  blue: '#2563eb',
  green: '#15803d',
  amber: '#b45309',
}

const formatDateBr = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const drawSectionTitle = (doc, title) => {
  doc.moveDown(0.8)
  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.ink).text(title)
  doc.moveDown(0.45)
}

const drawMetric = (doc, x, y, width, label, value, caption, color) => {
  doc.roundedRect(x, y, width, 78, 8).fillAndStroke('#ffffff', colors.border)
  doc.font('Helvetica').fontSize(8).fillColor(colors.muted).text(label, x + 12, y + 12, { width: width - 24 })
  doc.font('Helvetica-Bold').fontSize(20).fillColor(color).text(String(value), x + 12, y + 29)
  doc.font('Helvetica').fontSize(7.5).fillColor(colors.muted).text(caption, x + 12, y + 57, { width: width - 24 })
}

const ensureSpace = (doc, height) => {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage()
}

export const buildRelatorioPdfBuffer = (relatorio) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true })
  const chunks = []
  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => resolve(Buffer.concat(chunks)))
  doc.on('error', reject)

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  doc.rect(0, 0, doc.page.width, 116).fill(colors.ink)
  doc.font('Helvetica-Bold').fontSize(21).fillColor('#ffffff').text('Relatório comercial', 44, 36)
  doc.font('Helvetica').fontSize(10).fillColor('#dbeafe').text('CRM Compact.Jr', 44, 66)
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text(
    `Período: ${formatDateBr(relatorio.periodo.dataInicio)} a ${formatDateBr(relatorio.periodo.dataFim)}`,
    44, 87
  )
  doc.y = 137

  const filtros = relatorio.filtros ?? {}
  const filtrosAtivos = [
    filtros.nomeLead ? `Lead: ${filtros.nomeLead}` : null,
    filtros.empresa ? `Empresa: ${filtros.empresa}` : null,
    filtros.cidade ? `Cidade: ${filtros.cidade}` : null,
    filtros.nicho ? `Nicho: ${filtros.nicho}` : null,
    filtros.status ? `Status: ${filtros.status}` : null,
  ].filter(Boolean)
  const alturaFiltros = filtrosAtivos.length > 0 ? 78 : 43
  doc.roundedRect(44, doc.y, pageWidth, alturaFiltros, 7).fill(colors.pale)
  doc.font('Helvetica').fontSize(9).fillColor(colors.muted).text('RESPONSÁVEL', 57, doc.y + 8)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.ink).text(relatorio.responsavel, 57, doc.y + 21, { width: pageWidth - 26 })
  if (filtrosAtivos.length > 0) {
    doc.font('Helvetica').fontSize(8).fillColor(colors.muted)
      .text(`Filtros: ${filtrosAtivos.join(' | ')}`, 57, doc.y + 40, { width: pageWidth - 26 })
  }
  doc.y += alturaFiltros + 15

  drawSectionTitle(doc, 'Indicadores do período')
  const metrics = [
    ['Leads no período', relatorio.leadsNoPeriodo, 'novos leads', colors.blue],
    ['Oportunidades criadas', relatorio.oportunidadesCriadas, 'no período', colors.blue],
    ['Oportunidades abertas', relatorio.oportunidadesAbertas, 'em andamento', colors.amber],
    ['Oportunidades fechadas', relatorio.oportunidadesFechadas, 'concluídas com sucesso', colors.green],
    ['Taxa de conversão', `${relatorio.taxaConversao}%`, 'fechadas / criadas', colors.green],
  ]
  const gap = 9
  const cardWidth = (pageWidth - gap * 2) / 3
  const startY = doc.y
  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 3)
    const column = index % 3
    drawMetric(doc, 44 + column * (cardWidth + gap), startY + row * 88, cardWidth, ...metric)
  })
  doc.y = startY + 2 * 88 + 4

  ensureSpace(doc, 100)
  drawSectionTitle(doc, 'Tempo médio por etapa')
  const tableX = 44
  const tableY = doc.y
  const col1 = pageWidth * 0.68
  const rowHeight = 25
  doc.rect(tableX, tableY, pageWidth, rowHeight).fill(colors.pale)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.ink)
  doc.text('Etapa', tableX + 10, tableY + 8, { width: col1 - 12 })
  doc.text('Tempo médio', tableX + col1, tableY + 8, { width: pageWidth - col1 - 10, align: 'right' })
  doc.y = tableY + rowHeight

  const stages = relatorio.tempoMedioPorEtapa ?? []
  if (stages.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(colors.muted).text('Não há etapas para exibir neste relatório.', tableX + 10, doc.y + 9)
    doc.y += rowHeight
  } else {
    stages.forEach((item, index) => {
      ensureSpace(doc, rowHeight + 6)
      const y = doc.y
      if (index % 2 === 0) doc.rect(tableX, y, pageWidth, rowHeight).fill('#fbfdff')
      doc.strokeColor(colors.border).moveTo(tableX, y + rowHeight).lineTo(tableX + pageWidth, y + rowHeight).stroke()
      doc.font('Helvetica').fontSize(9).fillColor(colors.ink).text(item.etapa, tableX + 10, y + 8, { width: col1 - 12 })
      doc.text(`${item.diasMedio} dias`, tableX + col1, y + 8, { width: pageWidth - col1 - 10, align: 'right' })
      doc.y += rowHeight
    })
  }

  const range = doc.bufferedPageRange()
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index)
    const footerY = doc.page.height - 30
    doc.moveTo(44, footerY - 8).lineTo(doc.page.width - 44, footerY - 8).strokeColor(colors.border).stroke()
    doc.font('Helvetica').fontSize(7).fillColor(colors.muted)
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`, 44, footerY, { width: pageWidth / 2 })
      .text(`Página ${index + 1} de ${range.count}`, 44 + pageWidth / 2, footerY, { width: pageWidth / 2, align: 'right' })
  }

  doc.end()
})
