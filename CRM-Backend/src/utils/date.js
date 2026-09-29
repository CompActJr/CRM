export const formatDateBr = (date) => {
  return date.toISOString().slice(0, 10).split('-').reverse().join('/')
}

export const parseDateInput = (value) => {
  if (!value || typeof value !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const formatDateTimeBr = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export const parseDateTimeInput = (value) => {
  if (!value || typeof value !== 'string') return null
  const normalized = value.trim()
  const parsed = new Date(normalized.length === 16 ? `${normalized}:00` : normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
