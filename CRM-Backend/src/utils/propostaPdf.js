import PDFDocument from 'pdfkit'
import { formatCurrencyBr } from './currency.js'
import { formatDateBr } from './date.js'

const PdfConfig = {
  margin: 50,
  brand: 'CRM CompAct.Jr',
  subtitle: 'Gestão Comercial',
  accent: '#1e40af',
}

const PropostaStatusLabels = {
  Rascunho: 'Rascunho',
  Enviada: 'Enviada',
  EmNegociacao: 'Em negociação',
  Aceita: 'Aceita',
  Recusada: 'Recusada',
}

const slugifyFilename = (text) =>
  String(text ?? 'proposta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'proposta'

const drawSectionTitle = (doc, title) => {
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(12).fillColor(PdfConfig.accent).text(title)
  doc.moveDown(0.3)
  doc.font('Helvetica').fontSize(10).fillColor('#1e293b')
}

const drawField = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
  doc.font('Helvetica').text(value || '—')
}

export const buildPropostaPdfBuffer = (proposta) => {
  const lead = proposta.oportunidade?.lead
  const oportunidade = proposta.oportunidade
  const statusLabel = PropostaStatusLabels[proposta.status] ?? proposta.status
  const valorFormatado = formatCurrencyBr(proposta.valor)
  const dataFormatada = formatDateBr(proposta.dataProposta)
  const geradoEm = new Date().toLocaleString('pt-BR')

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PdfConfig.margin, size: 'A4' })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font('Helvetica-Bold').fontSize(22).fillColor(PdfConfig.accent).text(PdfConfig.brand)
    doc.font('Helvetica').fontSize(11).fillColor('#64748b').text(PdfConfig.subtitle)
    doc.moveDown(1)

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text('Proposta Comercial')
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b').text(proposta.titulo)
    doc.moveDown(1)

    drawSectionTitle(doc, 'Dados da proposta')
    drawField(doc, 'Valor', valorFormatado)
    drawField(doc, 'Status', statusLabel)
    drawField(doc, 'Data', dataFormatada)
    drawField(doc, 'Responsável', proposta.usuario?.nome)

    if (proposta.observacoes?.trim()) {
      drawSectionTitle(doc, 'Observações')
      doc.font('Helvetica').text(proposta.observacoes.trim())
    }

    drawSectionTitle(doc, 'Oportunidade')
    drawField(doc, 'Título', oportunidade?.titulo)
    drawField(doc, 'Etapa do funil', oportunidade?.etapaFunil?.nome)
    drawField(doc, 'Valor estimado', formatCurrencyBr(oportunidade?.valorEstimado ?? 0))
    drawField(doc, 'Responsável comercial', oportunidade?.usuario?.nome)

    drawSectionTitle(doc, 'Cliente / Lead')
    drawField(doc, 'Nome', lead?.nome)
    drawField(doc, 'Empresa', lead?.empresa)
    drawField(doc, 'E-mail', lead?.email)
    drawField(doc, 'Telefone', lead?.telefone)
    drawField(doc, 'Cidade', lead?.cidade)

    doc.moveDown(2)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#94a3b8')
      .text(
        'Documento gerado automaticamente pelo CRM Compact.Jr. Este material resume os dados cadastrados da proposta e da oportunidade vinculada.',
        { align: 'left' }
      )
    doc.moveDown(0.5)
    doc.text(`Gerado em: ${geradoEm}`)

    doc.end()
  })
}

export const buildPropostaPdfFilename = (proposta) => {
  const slug = slugifyFilename(proposta.titulo)
  return `proposta-${slug}.pdf`
}
