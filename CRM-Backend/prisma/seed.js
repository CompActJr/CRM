import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ErrorMessages = {
  seedFailed: 'Seed failed',
}

const SeedConfig = {
  adminEmail: 'admin@empresa.com',
  adminSenha: '123456',
}

async function main() {
  const senhaHash = await bcrypt.hash(SeedConfig.adminSenha, 10)

  await prisma.proposta.deleteMany()
  await prisma.tarefa.deleteMany()
  await prisma.interacao.deleteMany()
  await prisma.negocioEtapaHistorico.deleteMany()
  await prisma.negocio.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.motivoPerda.deleteMany()
  await prisma.cargo.deleteMany()
  await prisma.etapaFunil.deleteMany()
  await prisma.usuario.deleteMany()

  await Promise.all(
    [
      { nome: 'Prospecção', ordem: 1 },
      { nome: 'Qualificação', ordem: 2 },
      { nome: 'Diagnóstico', ordem: 3 },
      { nome: 'Proposta', ordem: 4 },
      { nome: 'Negociação', ordem: 5 },
      { nome: 'Fechado', ordem: 6 },
      { nome: 'Perdida', ordem: 7 },
    ].map((etapa) => prisma.etapaFunil.create({ data: etapa }))
  )

  await prisma.motivoPerda.createMany({
    data: [
      { nome: 'Preço alto' },
      { nome: 'Sem orçamento' },
      { nome: 'Sem resposta do cliente' },
      { nome: 'Prazo não atendido' },
    ],
  })

  await prisma.cargo.createMany({
    data: [
      { nome: 'Administrador' },
      { nome: 'Diretor Comercial' },
      { nome: 'Segundo em comando' },
      { nome: 'Assessor' },
      { nome: 'Vendedor' },
    ],
  })

  await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: SeedConfig.adminEmail,
      cargo: 'Administrador',
      senha: senhaHash,
      perfilAcesso: 'Administrador',
    },
  })

  console.log('Seed concluído — banco zerado para uso manual.')
  console.log(`Admin: ${SeedConfig.adminEmail} / ${SeedConfig.adminSenha}`)
}

main()
  .catch((error) => {
    console.error(ErrorMessages.seedFailed, error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
