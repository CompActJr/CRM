import PDFDocument from 'pdfkit'

const MARGIN = 44

const colors = {
  text: '#0f172a',
  secondary: '#334155',
  muted: '#64748b',
  rule: '#cbd5e1',
  hairline: '#e2e8f0',
  red: '#dc2626',
}

const formatDateBr = (isoDate) => {
  if (!isoDate || !isoDate.includes('-')) return isoDate || '-'
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateTimeBr = (value) => {
  if (!value) return 'Ainda não sincronizado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const drawRule = (doc, y, width, color = colors.hairline, lineWidth = 0.5) => {
  doc
    .save()
    .lineWidth(lineWidth)
    .strokeColor(color)
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + width, y)
    .stroke()
    .restore()
}

const ensureSpace = (doc, neededHeight) => {
  const bottomLimit = doc.page.height - MARGIN - 24
  if (doc.y + neededHeight > bottomLimit) {
    doc.addPage()
    doc.y = MARGIN
    return true
  }
  return false
}

const drawSectionTitle = (doc, title, pageWidth) => {
  ensureSpace(doc, 48)
  doc.y += 14
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(colors.text)
    .text(title.toUpperCase(), MARGIN, doc.y, { characterSpacing: 0.4 })
  const ruleY = doc.y + 4
  drawRule(doc, ruleY, pageWidth, colors.text, 0.8)
  doc.y = ruleY + 10
}

const drawSummaryStrip = (doc, items, pageWidth) => {
  const stripHeight = 52
  ensureSpace(doc, stripHeight + 8)

  const startY = doc.y
  const colWidth = pageWidth / items.length

  items.forEach((item, index) => {
    const x = MARGIN + index * colWidth
    const innerWidth = colWidth - 10

    if (index > 0) {
      doc
        .save()
        .lineWidth(0.5)
        .strokeColor(colors.hairline)
        .moveTo(x - 4, startY + 2)
        .lineTo(x - 4, startY + stripHeight - 6)
        .stroke()
        .restore()
    }

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(item.label, x, startY, { width: innerWidth, lineBreak: false, ellipsis: true })

    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(colors.text)
      .text(String(item.value), x, startY + 14, { width: innerWidth, lineBreak: false, ellipsis: true })

    if (item.caption) {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(colors.muted)
        .text(item.caption, x, startY + 35, { width: innerWidth, lineBreak: false, ellipsis: true })
    }
  })

  drawRule(doc, startY + stripHeight, pageWidth, colors.hairline, 0.5)
  doc.y = startY + stripHeight + 6
}

const drawTableHeader = (doc, columns, pageWidth) => {
  const headerY = doc.y
  columns.forEach((col) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(col.label.toUpperCase(), col.x, headerY, {
        width: col.width,
        align: col.align || 'left',
        lineBreak: false,
      })
  })
  const ruleY = headerY + 14
  drawRule(doc, ruleY, pageWidth, colors.rule, 0.75)
  doc.y = ruleY + 6
}

export const buildRelatorioPdfBuffer = (relatorio) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - MARGIN * 2

    // Cabeçalho minimalista
    const headerTop = MARGIN
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(colors.text)
      .text('Relatório Comercial', MARGIN, headerTop)

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(colors.muted)
      .text('CRM CompAct.Jr', MARGIN, headerTop + 20)

    const rightColX = MARGIN + pageWidth * 0.5
    const rightColWidth = pageWidth * 0.5
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(colors.text)
      .text(
        `Período: ${formatDateBr(relatorio.periodo.dataInicio)} a ${formatDateBr(relatorio.periodo.dataFim)}`,
        rightColX,
        headerTop + 3,
        { width: rightColWidth, align: 'right' }
      )

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.muted)
      .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, rightColX, headerTop + 18, {
        width: rightColWidth,
        align: 'right',
      })

    const headerRuleY = headerTop + 38
    drawRule(doc, headerRuleY, pageWidth, colors.text, 1)
    doc.y = headerRuleY + 12

    // Parâmetros e filtros (esquemático, sem caixas)
    const filtros = relatorio.filtros ?? {}
    const filtrosAtivos = [
      filtros.tipoMeta ? `Meta: ${filtros.tipoMeta}` : null,
      filtros.nomeLead ? `Lead: ${filtros.nomeLead}` : null,
      filtros.empresa ? `Empresa: ${filtros.empresa}` : null,
      filtros.cidade ? `Cidade: ${filtros.cidade}` : null,
      filtros.nicho ? `Nicho: ${filtros.nicho}` : null,
      filtros.status ? `Status: ${filtros.status}` : null,
      filtros.visualizacaoPerdas ? `Visualização: ${filtros.visualizacaoPerdas}` : null,
      relatorio.termometroMej ? 'Termômetro MEJ: Sim' : null,
    ].filter(Boolean)

    const metaY = doc.y
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.muted).text('Responsável:', MARGIN, metaY, {
      continued: true,
    })
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.text).text(` ${relatorio.responsavel}`)

    if (filtrosAtivos.length > 0) {
      doc.y += 2
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(colors.muted)
        .text('Filtros:', MARGIN, doc.y, { continued: true })
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(` ${filtrosAtivos.join('  ·  ')}`, { width: pageWidth })
    }

    drawRule(doc, doc.y + 8, pageWidth, colors.hairline, 0.5)
    doc.y += 14

    // Indicadores do período
    drawSectionTitle(doc, 'Indicadores do período', pageWidth)
    const negociosCriados = relatorio.negociosCriadas ?? relatorio.oportunidadesCriadas ?? 0
    const negociosAbertos = relatorio.negociosAbertas ?? relatorio.oportunidadesAbertas ?? 0
    const negociosFechados = relatorio.negociosFechadas ?? relatorio.oportunidadesFechadas ?? 0
    const visualizacaoPerdas = relatorio.visualizacaoPerdas ?? 'tudo'
    const mostrarEstatisticasPerdas = visualizacaoPerdas !== 'sem_perdas'
    const mostrarEstatisticasComerciais = visualizacaoPerdas !== 'apenas_perdas'

    drawSummaryStrip(
      doc,
      [
        ...(mostrarEstatisticasComerciais ? [
          { label: 'Leads no período', value: relatorio.leadsNoPeriodo ?? 0, caption: 'cadastrados' },
          { label: 'Negócios criados', value: negociosCriados, caption: 'no período' },
          { label: 'Negócios abertos', value: negociosAbertos, caption: 'em andamento' },
          { label: 'Negócios fechados', value: negociosFechados, caption: 'concluídos' },
          { label: 'Taxa de conversão', value: `${relatorio.taxaConversao ?? 0}%`, caption: 'fechados / criados' },
        ] : []),
        ...(mostrarEstatisticasPerdas ? [
          { label: 'Negócios perdidos', value: relatorio.perdasNoPeriodo ?? 0, caption: 'no período' },
        ] : []),
      ],
      pageWidth
    )

    if (mostrarEstatisticasPerdas) {
      drawSectionTitle(doc, 'Perdas por período', pageWidth)
      const perdasCols = [
        { label: 'Período', x: MARGIN, width: pageWidth * 0.72, align: 'left' },
        { label: 'Quantidade', x: MARGIN + pageWidth * 0.72, width: pageWidth * 0.28, align: 'right' },
      ]
      const perdasPorPeriodo = relatorio.perdasPorPeriodo ?? []
      if (perdasPorPeriodo.length === 0) {
        doc.font('Helvetica').fontSize(8.5).fillColor(colors.muted)
          .text('Nenhuma perda no período selecionado.', MARGIN, doc.y)
        doc.y += 14
      } else {
        drawTableHeader(doc, perdasCols, pageWidth)
        perdasPorPeriodo.forEach((item) => {
          if (ensureSpace(doc, 24)) drawTableHeader(doc, perdasCols, pageWidth)
          const y = doc.y
          doc.font('Helvetica').fontSize(8.5).fillColor(colors.text)
            .text(item.periodo, perdasCols[0].x, y, { width: perdasCols[0].width })
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.red)
            .text(String(item.quantidade), perdasCols[1].x, y, { width: perdasCols[1].width, align: 'right' })
          drawRule(doc, y + 16, pageWidth, colors.hairline, 0.4)
          doc.y = y + 20
        })
      }

      drawSectionTitle(doc, 'Perdas por motivo', pageWidth)
      const motivos = relatorio.perdasPorMotivo ?? []
      const motivoCols = [
        { label: 'Motivo', x: MARGIN, width: pageWidth * 0.58, align: 'left' },
        { label: 'Quantidade', x: MARGIN + pageWidth * 0.58, width: pageWidth * 0.22, align: 'right' },
        { label: 'Percentual', x: MARGIN + pageWidth * 0.80, width: pageWidth * 0.20, align: 'right' },
      ]
      if (motivos.length === 0) {
        doc.font('Helvetica').fontSize(8.5).fillColor(colors.muted)
          .text('Nenhum motivo de perda informado no período.', MARGIN, doc.y)
        doc.y += 14
      } else {
        drawTableHeader(doc, motivoCols, pageWidth)
        motivos.forEach((item) => {
          if (ensureSpace(doc, 24)) drawTableHeader(doc, motivoCols, pageWidth)
          const y = doc.y
          doc.font('Helvetica').fontSize(8.5).fillColor(colors.text)
            .text(item.motivo, motivoCols[0].x, y, { width: motivoCols[0].width - 6 })
          doc.text(String(item.quantidade), motivoCols[1].x, y, { width: motivoCols[1].width, align: 'right' })
          doc.text(`${item.percentual}%`, motivoCols[2].x, y, { width: motivoCols[2].width, align: 'right' })
          drawRule(doc, y + 16, pageWidth, colors.hairline, 0.4)
          doc.y = y + 20
        })
      }
    }

    if (mostrarEstatisticasComerciais) {
    // Tempo médio por etapa
    drawSectionTitle(doc, 'Tempo médio por etapa', pageWidth)
    const stageCols = [
      { label: 'Etapa', x: MARGIN, width: pageWidth * 0.72, align: 'left' },
      { label: 'Tempo médio', x: MARGIN + pageWidth * 0.72, width: pageWidth * 0.28, align: 'right' },
    ]
    const stages = relatorio.tempoMedioPorEtapa ?? []

    if (stages.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(colors.muted)
        .text('Não há etapas para exibir neste relatório.', MARGIN, doc.y)
      doc.y += 14
    } else {
      drawTableHeader(doc, stageCols, pageWidth)
      const rowHeight = 20
      stages.forEach((item) => {
        if (ensureSpace(doc, rowHeight + 4)) {
          drawTableHeader(doc, stageCols, pageWidth)
        }
        const y = doc.y
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(colors.text)
          .text(item.etapa, stageCols[0].x, y + 2, { width: stageCols[0].width - 8, lineBreak: false, ellipsis: true })
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor(colors.secondary)
          .text(`${item.diasMedio} dias`, stageCols[1].x, y + 2, { width: stageCols[1].width, align: 'right', lineBreak: false })

        drawRule(doc, y + rowHeight - 2, pageWidth, colors.hairline, 0.4)
        doc.y = y + rowHeight
      })
    }

    // Metas comerciais
    if (relatorio.metas?.metas?.length) {
      drawSectionTitle(doc, 'Metas comerciais no período', pageWidth)
      const metaCols = [
        { label: 'Vendedor', x: MARGIN, width: pageWidth * 0.25, align: 'left' },
        { label: 'Meta', x: MARGIN + pageWidth * 0.25, width: pageWidth * 0.27, align: 'left' },
        { label: 'Período', x: MARGIN + pageWidth * 0.52, width: pageWidth * 0.20, align: 'left' },
        { label: 'Realizado / Alvo', x: MARGIN + pageWidth * 0.72, width: pageWidth * 0.16, align: 'right' },
        { label: 'Progresso', x: MARGIN + pageWidth * 0.88, width: pageWidth * 0.12, align: 'right' },
      ]

      drawTableHeader(doc, metaCols, pageWidth)
      const rowHeight = 21
      relatorio.metas.metas.forEach((item) => {
        if (ensureSpace(doc, rowHeight + 4)) {
          drawTableHeader(doc, metaCols, pageWidth)
        }
        const y = doc.y
        const periodoStr =
          item.periodoInicio && item.periodoFim
            ? `${formatDateBr(item.periodoInicio)} a ${formatDateBr(item.periodoFim)}`
            : '-'

        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor(colors.text)
          .text(item.usuarioNome, metaCols[0].x, y + 2, { width: metaCols[0].width - 6, lineBreak: false, ellipsis: true })
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(colors.secondary)
          .text(item.tipoLabel, metaCols[1].x, y + 2, { width: metaCols[1].width - 6, lineBreak: false, ellipsis: true })
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor(colors.muted)
          .text(periodoStr, metaCols[2].x, y + 3, { width: metaCols[2].width - 6, lineBreak: false, ellipsis: true })
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(colors.text)
          .text(`${item.valorRealizado} / ${item.valorAlvo}`, metaCols[3].x, y + 2, {
            width: metaCols[3].width,
            align: 'right',
            lineBreak: false,
          })
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor(colors.text)
          .text(`${item.progressoPercentual}%`, metaCols[4].x, y + 2, {
            width: metaCols[4].width,
            align: 'right',
            lineBreak: false,
          })

        drawRule(doc, y + rowHeight - 2, pageWidth, colors.hairline, 0.4)
        doc.y = y + rowHeight
      })
    }

    // Termômetro MEJ
    if (relatorio.termometroMej) {
      const tm = relatorio.termometroMej
      drawSectionTitle(doc, `Termômetro MEJ · Faturamento ${tm.ano}`, pageWidth)

      if (!tm.disponivel) {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(colors.muted)
          .text('Nenhuma leitura do Portal Brasil Júnior foi salva até o momento.', MARGIN, doc.y)
        doc.y += 14
      } else {
        const percentualNum = Number(tm.percentual ?? 0)
        const percentualText = `${percentualNum.toFixed(1).replace('.', ',')}%`

        drawSummaryStrip(
          doc,
          [
            { label: 'Faturamento alcançado', value: tm.alcancadoFormatado, caption: 'Portal Brasil Júnior' },
            { label: 'Meta anual', value: tm.metaFormatada, caption: `exercício ${tm.ano}` },
            { label: 'Gap para a meta', value: tm.gapFormatado, caption: 'restante' },
            { label: 'Percentual atingido', value: percentualText, caption: 'da meta anual' },
          ],
          pageWidth
        )

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor(colors.muted)
          .text(`Última atualização: ${formatDateTimeBr(tm.coletadoEm)}`, MARGIN, doc.y)
        doc.y += 10
      }
    }
    }

    // Rodapé em todas as páginas
    const range = doc.bufferedPageRange()
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index)
      const prevBottom = doc.page.margins.bottom
      doc.page.margins.bottom = 0
      const footerY = doc.page.height - 28
      drawRule(doc, footerY - 8, pageWidth, colors.hairline, 0.5)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(colors.muted)
        .text('CRM CompAct.Jr · Relatório Comercial', MARGIN, footerY, {
          width: pageWidth / 2,
          lineBreak: false,
        })
        .text(`Página ${index + 1} de ${range.count}`, MARGIN + pageWidth / 2, footerY, {
          width: pageWidth / 2,
          align: 'right',
          lineBreak: false,
        })
      doc.page.margins.bottom = prevBottom
    }

    doc.end()
  })
