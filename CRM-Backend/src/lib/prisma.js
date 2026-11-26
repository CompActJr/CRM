import { PrismaClient } from '@prisma/client'

const getRuntimeDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) return null

  try {
    const databaseUrl = new URL(process.env.DATABASE_URL)
    const connectionLimit = Number(databaseUrl.searchParams.get('connection_limit'))

    if (!Number.isInteger(connectionLimit) || connectionLimit > 5) {
      databaseUrl.searchParams.set('connection_limit', '5')
    }

    return databaseUrl.toString()
  } catch {
    return process.env.DATABASE_URL
  }
}

const runtimeDatabaseUrl = getRuntimeDatabaseUrl()
const prisma = new PrismaClient(
  runtimeDatabaseUrl
    ? { datasources: { db: { url: runtimeDatabaseUrl } } }
    : {}
)

export default prisma
