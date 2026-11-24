import cron from 'node-cron'
import { Config } from '../config/constants.js'
import { syncTermometroMej } from '../services/portalBjScraper.service.js'

let scheduledTask = null

export const startTermometroScheduler = () => {
  if (scheduledTask) return scheduledTask

  if (!Config.portalBj.email || !Config.portalBj.senha) {
    console.warn(
      '[Termômetro MEJ] Agendamento desativado: configure PORTAL_BJ_EMAIL e PORTAL_BJ_SENHA no .env.'
    )
    return null
  }

  const expression = Config.portalBj.cron
  if (!cron.validate(expression)) {
    console.error(`[Termômetro MEJ] Expressão cron inválida: "${expression}"`)
    return null
  }

  scheduledTask = cron.schedule(
    expression,
    async () => {
      console.log('[Termômetro MEJ] Iniciando coleta agendada no Portal BJ...')
      try {
        const result = await syncTermometroMej()
        console.log(
          `[Termômetro MEJ] Coleta concluída (${result.ano}): ${result.percentual}% da meta.`
        )
      } catch (error) {
        console.error('[Termômetro MEJ] Falha na coleta agendada:', error.message)
      }
    },
    { timezone: 'America/Sao_Paulo' }
  )

  console.log(`[Termômetro MEJ] Agendador ativo (${expression} America/Sao_Paulo).`)
  return scheduledTask
}

