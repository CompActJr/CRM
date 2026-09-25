import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SeedConfig = {
  adminEmail: 'admin@empresa.com',
  adminSenha: '123456',
}

import { EtapasFunilDefault as EtapasFunil } from '../src/config/constants.js'

const MotivosPerda = ['Preço alto', 'Sem orçamento', 'Sem resposta do cliente', 'Prazo não atendido']

const CargosDefault = [
  'Administrador',
  'Vendedor',
]

async function main() {
  // Sincroniza/Upsert das etapas do funil com segurança
  for (const etapa of EtapasFunil) {
    const existingByName = await prisma.etapaFunil.findFirst({ where: { nome: etapa.nome } })
    const existingByOrdem = await prisma.etapaFunil.findFirst({ where: { ordem: etapa.ordem } })

    if (existingByName) {
      await prisma.etapaFunil.update({
        where: { id: existingByName.id },
        data: { ordem: etapa.ordem },
      })
    } else if (existingByOrdem) {
      await prisma.etapaFunil.update({
        where: { id: existingByOrdem.id },
        data: { nome: etapa.nome },
      })
    } else {
      await prisma.etapaFunil.create({ data: etapa })
    }
  }

  const usuarioCount = await prisma.usuario.count()
  if (usuarioCount > 0) {
    console.log('Banco já inicializado — etapas sincronizadas.')
    return
  }

  const senhaHash = await bcrypt.hash(SeedConfig.adminSenha, 10)

  await prisma.motivoPerda.createMany({
    data: MotivosPerda.map((nome) => ({ nome })),
  })

  await prisma.cargo.createMany({
    data: CargosDefault.map((nome) => ({ nome })),
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

  console.log('Seed inicial concluído.')
  console.log(`Admin: ${SeedConfig.adminEmail} / ${SeedConfig.adminSenha}`)
}

main()
  .catch((error) => {
    console.error('Falha no seed inicial:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
