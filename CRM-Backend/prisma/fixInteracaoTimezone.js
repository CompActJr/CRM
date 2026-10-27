import { pathToFileURL } from 'node:url'
import prisma from '../src/lib/prisma.js'

// Interações criadas pelo modal de mudança de etapa enviavam o horário local como
// wall clock e a API (em UTC) gravava 3h adiantado. Este script reposiciona
// apenas essas linhas para o instante correto.
const DESLOCAMENTO_MS = 3 * 60 * 60 * 1000
const TOLERANCIA_MS = 10 * 60 * 1000

const descricoesAutomaticas = [
  'Negócio movido de',
  'Negocio movido de',
  'Oportunidade movida de',
  'Oportunidade movido de',
]

export const buildPlano = (registros) =>
  registros.map((registro) => {
    const defasagemMs = registro.createdAt.getTime() - registro.dataInteracao.getTime()
    return {
      id: registro.id,
      descricao: registro.descricao,
      dataAtual: registro.dataInteracao,
      dataCorrigida: new Date(registro.dataInteracao.getTime() + DESLOCAMENTO_MS),
      defasagemMinutos: Math.round(defasagemMs / 60000),
      // Linhas gravadas por um servidor já em horário de Brasília ficam com defasagem ~0
      // e não devem ser deslocadas novamente.
      precisaCorrecao: Math.abs(defasagemMs - DESLOCAMENTO_MS) <= TOLERANCIA_MS,
    }
  })

const main = async () => {
  const aplicar = process.argv.includes('--apply')

  const registros = await prisma.interacao.findMany({
    where: {
      tipo: 'Registro',
      OR: descricoesAutomaticas.map((descricao) => ({
        descricao: { startsWith: descricao },
      })),
    },
    select: { id: true, descricao: true, dataInteracao: true, createdAt: true },
    orderBy: { id: 'asc' },
  })

  const plano = buildPlano(registros)
  const correcoes = plano.filter((item) => item.precisaCorrecao)
  const ignorados = plano.filter((item) => !item.precisaCorrecao)

  console.log(`Interações automáticas encontradas: ${plano.length}`)
  for (const item of correcoes) {
    console.log(
      `  #${item.id} ${item.dataAtual.toISOString()} -> ${item.dataCorrigida.toISOString()} (defasagem ${item.defasagemMinutos}min) | ${item.descricao}`
    )
  }
  if (ignorados.length > 0) {
    console.log(`Já corretas / fora do padrão (não serão alteradas): ${ignorados.length}`)
    for (const item of ignorados) {
      console.log(`  #${item.id} defasagem ${item.defasagemMinutos}min | ${item.descricao}`)
    }
  }

  if (!aplicar) {
    console.log('\nDry-run: nenhuma alteração foi gravada. Use --apply para aplicar.')
    return
  }

  if (correcoes.length === 0) return

  await prisma.$transaction(
    correcoes.map((item) =>
      prisma.interacao.update({
        where: { id: item.id },
        data: { dataInteracao: item.dataCorrigida },
      })
    )
  )
  console.log(`\n${correcoes.length} interação(ões) corrigida(s).`)
}

const executadoDiretamente = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (executadoDiretamente) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
