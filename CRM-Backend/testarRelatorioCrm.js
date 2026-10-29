import path from 'node:path'
import { lerRelatorio } from './src/utils/parseRelatorioCrm.js'

async function main() {
  const caminhoArquivo = path.resolve(
    process.cwd(),
    process.argv[2] ?? 'Restaurantes - Passo Fundo.xlsx'
  )

  console.log(`Lendo planilha: ${caminhoArquivo}\n`)

  const dados = await lerRelatorio(caminhoArquivo)

  console.log('Relatório lido com sucesso!\n')
  console.log(JSON.stringify(dados, null, 2))
}

main().catch((erro) => {
  console.error('\nErro ao testar a leitura do relatório:')
  console.error(erro.message)
  process.exitCode = 1
})