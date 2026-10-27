// O CRM opera em horário de Brasília; usar o fuso do servidor faria o container
// (UTC) exibir e gravar horários com 3 horas de diferença.
const TIME_ZONE = 'America/Sao_Paulo'

const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const zonedParts = (date) =>
  Object.fromEntries(
    zonedPartsFormatter.formatToParts(date).map(({ type, value }) => [type, value])
  )

const zonedOffsetMs = (date) => {
  const parts = zonedParts(date)
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

const fromZonedWallClock = ({ year, month, day, hour, minute, second = 0 }) => {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  return new Date(asUtc - zonedOffsetMs(new Date(asUtc)))
}

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
  const parts = zonedParts(date)
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

const wallClockPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

export const parseDateTimeInput = (value) => {
  if (!value || typeof value !== 'string') return null
  const normalized = value.trim()

  const wallClock = wallClockPattern.exec(normalized)
  if (wallClock) {
    const [, year, month, day, hour, minute, second] = wallClock
    return fromZonedWallClock({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: second ? Number(second) : 0,
    })
  }

  // Valores com fuso explícito (ISO com Z ou offset) já são instantes absolutos.
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

// Colunas DATE não têm hora: fixar meio-dia UTC evita que o fuso local
// mostre o dia anterior ao formatar o valor como data e hora.
export const toDateOnlyInstant = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12))
