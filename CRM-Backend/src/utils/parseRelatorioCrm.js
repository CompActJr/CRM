import ExcelJS from 'exceljs'

function obterValorCelula(celula) {
  const valor = celula.value

  if (valor === null || valor === undefined) {
    return null
  }

  // Recupera o resultado de uma fórmula, quando houver.
  if (typeof valor === 'object') {
    if ('result' in valor) {
      return valor.result
    }

    if ('text' in valor) {
      return valor.text
    }

    // Recupera textos formatados como rich text.
    if ('richText' in valor && Array.isArray(valor.richText)) {
      return valor.richText
        .map((parte) => parte.text ?? '')
        .join('')
    }
  }

  return valor
}

function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function limparValor(valor) {
  if (typeof valor === 'string') {
    return valor.trim() || null
  }

  return valor ?? null
}

function definirPropriedade(objeto, chave, valor) {
  Object.defineProperty(objeto, chave, {
    value: valor,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

/**
 * Lê uma planilha de relatorio e retorna seus dados
 * organizados em um dicionário.
 *
 * @param {string|Buffer} arquivo Caminho do arquivo ou buffer da planilha.
 * @returns {Promise<Object>} Dicionário com os relatorio.
 */
export async function lerRelatorio(arquivo) {
  if (typeof arquivo !== 'string' && !Buffer.isBuffer(arquivo)) {
    throw new TypeError(
      'Informe o caminho do arquivo ou um buffer da planilha.'
    )
  }

  if (typeof arquivo === 'string' && !arquivo.trim()) {
    throw new TypeError('O caminho do arquivo não pode estar vazio.')
  }

  const workbook = new ExcelJS.Workbook()

  if (Buffer.isBuffer(arquivo)) {
    await workbook.xlsx.load(arquivo)
  } else {
    await workbook.xlsx.readFile(arquivo)
  }

  const worksheet = workbook.getWorksheet('Data')

  if (!worksheet) {
    throw new Error(
      'A planilha deve conter uma aba chamada "Data".'
    )
  }

  // Identifica as colunas a partir do cabeçalho.
  const cabecalho = worksheet.getRow(1)
  const colunas = {}

  const colunasEsperadas = {
    nome: 'nome',
    telefone: 'telefone',
    endereco: 'endereco',
  }

  for (let numeroColuna = 1;
    numeroColuna <= cabecalho.cellCount;
    numeroColuna++
  ) {
    const valor = obterValorCelula(
      cabecalho.getCell(numeroColuna)
    )

    const chave = normalizarTexto(valor)

    if (Object.hasOwn(colunasEsperadas, chave)) {
      colunas[colunasEsperadas[chave]] = numeroColuna
    }
  }

  // Valida a presença das três colunas obrigatórias.
  const colunasAusentes = Object.keys(colunasEsperadas)
    .filter((coluna) => !colunas[coluna])

  if (colunasAusentes.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${colunasAusentes.join(', ')}.`
    )
  }

  const dados = {}
  let total = 0

  // Percorre os registros, começando pela segunda linha.
  for (
    let numeroLinha = 2;
    numeroLinha <= worksheet.rowCount;
    numeroLinha++
  ) {
    const linha = worksheet.getRow(numeroLinha)

    const nome = limparValor(
      obterValorCelula(
        linha.getCell(colunas.nome)
      )
    )

    // Ignora linhas sem nome.
    if (nome === null || nome === undefined || nome === '') {
      continue
    }

    const telefone = limparValor(
      obterValorCelula(
        linha.getCell(colunas.telefone)
      )
    )

    const endereco = limparValor(
      obterValorCelula(
        linha.getCell(colunas.endereco)
      )
    )

    // Evita sobrescrever registros com nomes repetidos.
    let chave = String(nome)
    let numeroDuplicado = 2

    while (Object.hasOwn(dados, chave)) {
      chave = `${nome} (${numeroDuplicado})`
      numeroDuplicado++
    }

    definirPropriedade(dados, chave, {
      nome,
      telefone,
      endereco,
    })

    total++
  }

  return {
    total,
    dados,
  }
}