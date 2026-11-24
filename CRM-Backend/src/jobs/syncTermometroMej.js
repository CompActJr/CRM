import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config()

const { default: prisma } = await import('../lib/prisma.js')
const { syncTermometroMej } = await import('../services/portalBjScraper.service.js')

try {
  const result = await syncTermometroMej()
  console.log(
    `[Termômetro MEJ] Sincronizado (${result.ano}): Alcançado=${result.alcancado} | Meta=${result.meta} | Gap=${result.gap} | ${result.percentual}%`
  )
} catch (error) {
  console.error('[Termômetro MEJ] Erro na sincronização:', error.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}

