import fs from 'fs'
import { chromium } from 'playwright'
import { Config } from '../config/constants.js'
import prisma from '../lib/prisma.js'
import { parseCurrencyBr } from '../utils/currency.js'

let isSyncRunning = false

export const isTermometroSyncRunning = () => isSyncRunning

const resolveChromiumExecutable = () => {
  if (Config.portalBj.chromiumPath && fs.existsSync(Config.portalBj.chromiumPath)) {
    return Config.portalBj.chromiumPath
  }

  for (const candidate of ['/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return undefined
}

export const extractFaturamentoFromText = (rawText = '') => {
  const normalized = String(rawText).replace(/\u00a0/g, ' ')
  const match = normalized.match(
    /(?:^|\n)\s*FATURAMENTO\s+ALCANÇADO\s+(-?R\$\s*-?[\d.,]+)\s+META\s+(-?R\$\s*-?[\d.,]+)\s+GAP\s+(-?R\$\s*-?[\d.,]+)/i
  )

  if (!match) {
    throw new Error('Não foi possível localizar o card de FATURAMENTO no Portal BJ.')
  }

  const alcancado = parseCurrencyBr(match[1])
  const meta = parseCurrencyBr(match[2])
  const gap = parseCurrencyBr(match[3])

  if (alcancado === null || meta === null || gap === null) {
    throw new Error('Falha ao converter os valores monetários de faturamento do Portal BJ.')
  }

  const percentual = meta > 0 ? Number(((alcancado / meta) * 100).toFixed(2)) : 0

  return {
    alcancado,
    meta,
    gap,
    percentual,
  }
}

export const fetchFaturamentoPortalBj = async () => {
  const { email, senha, url, ano } = Config.portalBj

  if (!email || !senha) {
    throw new Error('Credenciais do Portal BJ não configuradas (PORTAL_BJ_EMAIL / PORTAL_BJ_SENHA).')
  }

  const executablePath = resolveChromiumExecutable()
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const context = await browser.newContext({ locale: 'pt-BR' })
    const page = await context.newPage()

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

    if (page.url().includes('sign-in') || page.url().includes('login')) {
      const emailInput = page
        .locator('input[name="emailOrCpf"], input[type="email"], input[name="email"]')
        .first()
      const passInput = page.locator('input[type="password"], input[name="password"]').first()

      await emailInput.waitFor({ state: 'visible', timeout: 15000 })
      await emailInput.fill(email)
      await passInput.fill(senha)

      const submitBtn = page.locator('button[type="submit"]').first()
      await Promise.all([
        page.waitForURL((currentUrl) => !currentUrl.href.includes('sign-in'), { timeout: 25000 }).catch(() => {}),
        submitBtn.click(),
      ])
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

      if (page.url().includes('sign-in')) {
        const pageText = await page.locator('body').innerText().catch(() => '')
        if (/captcha|robô|verifique/i.test(pageText)) {
          throw new Error('Portal BJ exibiu desafio anti-bot/CAPTCHA no login.')
        }
        throw new Error('Falha ao autenticar no Portal BJ. Verifique e-mail e senha.')
      }
    }

    if (!page.url().includes('/perfil')) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    }

    await page.waitForFunction(
      () => /FATURAMENTO\s+ALCANÇADO/i.test(document.body.innerText),
      null,
      { timeout: 25000 }
    )

    const bodyText = await page.locator('body').innerText()
    const metrics = extractFaturamentoFromText(bodyText)

    return {
      ano,
      ...metrics,
    }
  } finally {
    await browser.close()
  }
}

export const syncTermometroMej = async () => {
  if (isSyncRunning) {
    const error = new Error('Sincronização do Termômetro MEJ já está em andamento.')
    error.statusCode = 409
    throw error
  }

  isSyncRunning = true
  const ano = Config.portalBj.ano
  const now = new Date()

  try {
    const dados = await fetchFaturamentoPortalBj()

    return await prisma.termometroMej.upsert({
      where: { ano: dados.ano },
      create: {
        ano: dados.ano,
        alcancado: dados.alcancado,
        meta: dados.meta,
        gap: dados.gap,
        percentual: dados.percentual,
        coletadoEm: now,
        ultimoStatusColeta: 'SUCESSO',
        ultimoErro: null,
        ultimaTentativaEm: now,
      },
      update: {
        alcancado: dados.alcancado,
        meta: dados.meta,
        gap: dados.gap,
        percentual: dados.percentual,
        coletadoEm: now,
        ultimoStatusColeta: 'SUCESSO',
        ultimoErro: null,
        ultimaTentativaEm: now,
      },
    })
  } catch (error) {
    await prisma.termometroMej
      .upsert({
        where: { ano },
        create: {
          ano,
          ultimoStatusColeta: 'ERRO',
          ultimoErro: error.message || 'Erro desconhecido ao coletar dados do Portal BJ.',
          ultimaTentativaEm: now,
        },
        update: {
          ultimoStatusColeta: 'ERRO',
          ultimoErro: error.message || 'Erro desconhecido ao coletar dados do Portal BJ.',
          ultimaTentativaEm: now,
        },
      })
      .catch(() => {})

    throw error
  } finally {
    isSyncRunning = false
  }
}

