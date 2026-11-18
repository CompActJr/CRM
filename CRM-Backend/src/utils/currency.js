export const formatCurrencyBr = (value) => {
  const amount =
    typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
      ? value.toNumber()
      : Number(value)

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isNaN(amount) ? 0 : amount)
}

export const parseValorEstimado = (value) => {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const cleaned = String(value).replace(/[R$\s]/g, '')
  if (/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    const parsedDecimal = Number(cleaned)
    return Number.isNaN(parsedDecimal) ? null : parsedDecimal
  }

  const normalized = cleaned
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}
