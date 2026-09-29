import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const MS_PER_DAY = 1000 * 60 * 60 * 24

const SeedConfig = {
  adminEmail: 'admin@empresa.com',
  adminSenha: '123456',
}

import { EtapasFunilDefault as EtapasFunil } from '../src/config/constants.js'

const MotivosPerda = ['Preço alto', 'Sem orçamento', 'Sem resposta do cliente', 'Prazo não atendido']

const CargosDefault = [
  'Administrador',
  'Diretor Comercial',
  'Segundo em comando',
  'Assessor',
  'Vendedor',
  'Consultora Comercial',
  'Executivo de Vendas',
]

const Vendedores = [
  { nome: 'Ana Souza', email: 'ana@empresa.com', cargo: 'Consultora Comercial' },
  { nome: 'Bruno Lima', email: 'bruno@empresa.com', cargo: 'Executivo de Vendas' },
]

const LeadsDemo = [
  { nome: 'Carlos Mendes', empresa: 'TechNova Ltda', cidade: 'São Paulo', nicho: 'Tecnologia' },
  { nome: 'Fernanda Rocha', empresa: 'LogiFast', cidade: 'Campinas', nicho: 'Logística' },
  { nome: 'Ricardo Alves', empresa: 'Construmax', cidade: 'Curitiba', nicho: 'Construção' },
  { nome: 'Juliana Dias', empresa: 'Saúde+ Clínicas', cidade: 'Belo Horizonte', nicho: 'Saúde' },
  { nome: 'Marcos Pereira', empresa: 'AgroVerde', cidade: 'Goiânia', nicho: 'Agro' },
  { nome: 'Patrícia Nunes', empresa: 'EduPrime', cidade: 'Porto Alegre', nicho: 'Educação' },
  { nome: 'Eduardo Campos', empresa: 'RetailOne', cidade: 'Rio de Janeiro', nicho: 'Varejo' },
  { nome: 'Luciana Freitas', empresa: 'FinTrust', cidade: 'Brasília', nicho: 'Financeiro' },
  { nome: 'André Gomes', empresa: 'Indústria Atlas', cidade: 'Joinville', nicho: 'Indústria' },
  { nome: 'Camila Barros', empresa: 'Hotel Vista Mar', cidade: 'Salvador', nicho: 'Turismo' },
  { nome: 'Felipe Santos', empresa: 'AutoParts BR', cidade: 'São Paulo', nicho: 'Automotivo' },
  { nome: 'Renata Moura', empresa: 'BeautyLab', cidade: 'Florianópolis', nicho: 'Beleza' },
  { nome: 'Gustavo Pires', empresa: 'EnergySol', cidade: 'Recife', nicho: 'Energia' },
  { nome: 'Isabela Costa', empresa: 'FoodExpress', cidade: 'Fortaleza', nicho: 'Alimentação' },
  { nome: 'Thiago Ribeiro', empresa: 'SecureIT', cidade: 'São Paulo', nicho: 'Segurança' },
  { nome: 'Vanessa Lopes', empresa: 'ModaViva', cidade: 'Belém', nicho: 'Moda' },
  { nome: 'Rodrigo Martins', empresa: 'ImobPrime', cidade: 'São Paulo', nicho: 'Imobiliário' },
  { nome: 'Aline Teixeira', empresa: 'PetCare', cidade: 'Vitória', nicho: 'Pets' },
  { nome: 'Paulo Henrique', empresa: 'CloudBridge', cidade: 'São Paulo', nicho: 'Tecnologia' },
  { nome: 'Mariana Duarte', empresa: 'LegalPro', cidade: 'Curitiba', nicho: 'Jurídico' },
]

const OportunidadesDemo = [
  { titulo: 'CRM para equipe comercial', etapa: 'Prospecção', valor: 12000, prioridade: 'Media', dias: { Prospecção: 5 } },
  { titulo: 'Automação de follow-up', etapa: 'Prospecção', valor: 8500, prioridade: 'Baixa', dias: { Prospecção: 3 } },
  { titulo: 'Integração com ERP', etapa: 'Prospecção', valor: 22000, prioridade: 'Alta', dias: { Prospecção: 7 } },
  { titulo: 'Dashboard de vendas', etapa: 'Qualificação', valor: 15000, prioridade: 'Media', dias: { Prospecção: 4, Qualificação: 6 } },
  { titulo: 'Portal do cliente', etapa: 'Qualificação', valor: 18000, prioridade: 'Alta', dias: { Prospecção: 5, Qualificação: 8 } },
  { titulo: 'App mobile de campo', etapa: 'Qualificação', valor: 32000, prioridade: 'Media', dias: { Prospecção: 3, Qualificação: 5 } },
  { titulo: 'Migração de planilhas', etapa: 'Diagnóstico', valor: 9500, prioridade: 'Baixa', dias: { Prospecção: 4, Qualificação: 5, Diagnóstico: 9 } },
  { titulo: 'Funil personalizado', etapa: 'Diagnóstico', valor: 11000, prioridade: 'Media', dias: { Prospecção: 6, Qualificação: 7, Diagnóstico: 11 } },
  { titulo: 'Treinamento da equipe', etapa: 'Diagnóstico', valor: 7500, prioridade: 'Baixa', dias: { Prospecção: 3, Qualificação: 4, Diagnóstico: 7 } },
  { titulo: 'Proposta consultoria CRM', etapa: 'Proposta', valor: 28000, prioridade: 'Alta', dias: { Prospecção: 5, Qualificação: 6, Diagnóstico: 10, Proposta: 6 } },
  { titulo: 'Licenças anuais 50 usuários', etapa: 'Proposta', valor: 45000, prioridade: 'Alta', dias: { Prospecção: 4, Qualificação: 8, Diagnóstico: 9, Proposta: 8 } },
  { titulo: 'Módulo de relatórios', etapa: 'Proposta', valor: 14000, prioridade: 'Media', dias: { Prospecção: 6, Qualificação: 5, Diagnóstico: 8, Proposta: 5 } },
  { titulo: 'Renovação contrato anual', etapa: 'Negociação', valor: 36000, prioridade: 'Alta', dias: { Prospecção: 4, Qualificação: 6, Diagnóstico: 12, Proposta: 7, Negociação: 15 } },
  { titulo: 'Implantação multi-filial', etapa: 'Negociação', valor: 52000, prioridade: 'Alta', dias: { Prospecção: 5, Qualificação: 7, Diagnóstico: 10, Proposta: 9, Negociação: 18 } },
  { titulo: 'Pacote básico MEI', etapa: 'Negociação', valor: 4800, prioridade: 'Baixa', dias: { Prospecção: 3, Qualificação: 4, Diagnóstico: 6, Proposta: 5, Negociação: 10 } },
  { titulo: 'Upgrade plano premium', etapa: 'Negociação', valor: 19500, prioridade: 'Media', dias: { Prospecção: 4, Qualificação: 5, Diagnóstico: 8, Proposta: 6, Negociação: 12 } },
  { titulo: 'Projeto fechado - Alpha Corp', etapa: 'Fechado', valor: 41000, prioridade: 'Alta', dias: { Prospecção: 5, Qualificação: 6, Diagnóstico: 9, Proposta: 7, Negociação: 14, Fechado: 2 } },
  { titulo: 'Contrato assinado - Beta Ltda', etapa: 'Fechado', valor: 27000, prioridade: 'Media', dias: { Prospecção: 4, Qualificação: 5, Diagnóstico: 8, Proposta: 6, Negociação: 11, Fechado: 3 } },
  { titulo: 'Deal ganho - Gamma SA', etapa: 'Fechado', valor: 33000, prioridade: 'Alta', dias: { Prospecção: 6, Qualificação: 7, Diagnóstico: 10, Proposta: 8, Negociação: 16, Fechado: 1 } },
  { titulo: 'Oportunidade perdida - preço', etapa: 'Perdida', valor: 16000, prioridade: 'Media', motivo: 'Preço alto', dias: { Prospecção: 4, Qualificação: 6, Diagnóstico: 9, Proposta: 7, Negociação: 8, Perdida: 1 } },
  { titulo: 'Sem retorno do cliente', etapa: 'Perdida', valor: 9000, prioridade: 'Baixa', motivo: 'Sem resposta do cliente', dias: { Prospecção: 3, Qualificação: 5, Diagnóstico: 6, Proposta: 4, Perdida: 2 } },
  { titulo: 'Prazo não atendido', etapa: 'Perdida', valor: 24000, prioridade: 'Alta', motivo: 'Prazo não atendido', dias: { Prospecção: 5, Qualificação: 7, Diagnóstico: 11, Proposta: 9, Negociação: 6, Perdida: 1 } },
]

const daysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(10, 0, 0, 0)
  return date
}

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY)

const buildHistorico = (oportunidadeId, etapas, etapaAtualNome, diasPorEtapa) => {
  const ordemAtual = etapas.find((item) => item.nome === etapaAtualNome)?.ordem ?? 1
  const etapasPercorridas = etapas.filter((item) => item.ordem <= ordemAtual)
  const totalDias = etapasPercorridas.reduce((sum, item) => sum + (diasPorEtapa[item.nome] ?? 3), 0)

  let entrada = daysAgo(totalDias)
  const registros = []

  for (const etapa of etapasPercorridas) {
    const diasNaEtapa = diasPorEtapa[etapa.nome] ?? 3
    const isAtual = etapa.nome === etapaAtualNome
    const saida = isAtual ? null : addDays(entrada, diasNaEtapa)

    registros.push({
      oportunidadeId,
      etapaFunilId: etapa.id,
      entradaEm: entrada,
      saidaEm: saida,
    })

    if (saida) entrada = saida
  }

  return registros
}

const clearDatabase = async () => {
  await prisma.proposta.deleteMany()
  await prisma.tarefa.deleteMany()
  await prisma.interacao.deleteMany()
  await prisma.oportunidadeEtapaHistorico.deleteMany()
  await prisma.oportunidade.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.motivoPerda.deleteMany()
  await prisma.cargo.deleteMany()
  await prisma.etapaFunil.deleteMany()
  await prisma.usuario.deleteMany()
}

async function main() {
  const senhaHash = await bcrypt.hash(SeedConfig.adminSenha, 10)

  await clearDatabase()

  const etapas = await Promise.all(EtapasFunil.map((etapa) => prisma.etapaFunil.create({ data: etapa })))

  const motivos = await Promise.all(
    MotivosPerda.map((nome) => prisma.motivoPerda.create({ data: { nome } }))
  )
  const motivosPorNome = Object.fromEntries(motivos.map((item) => [item.nome, item.id]))

  await prisma.cargo.createMany({
    data: CargosDefault.map((nome) => ({ nome })),
  })

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: SeedConfig.adminEmail,
      cargo: 'Administrador',
      senha: senhaHash,
      perfilAcesso: 'Administrador',
    },
  })

  const vendedores = await Promise.all(
    Vendedores.map((vendedor) =>
      prisma.usuario.create({
        data: {
          ...vendedor,
          senha: senhaHash,
          perfilAcesso: 'Usuario',
        },
      })
    )
  )

  const usuarios = [admin, ...vendedores]
  const etapaPorNome = Object.fromEntries(etapas.map((item) => [item.nome, item.id]))
  const dataCadastro = daysAgo(90)

  const leads = await Promise.all(
    LeadsDemo.map((lead, index) =>
      prisma.lead.create({
        data: {
          nome: lead.nome,
          email: `${lead.nome.split(' ')[0].toLowerCase()}@${lead.empresa.replace(/\s/g, '').toLowerCase()}.com`,
          empresa: lead.empresa,
          cidade: lead.cidade,
          nicho: lead.nicho,
          status: 'Ativo',
          dataCadastro,
          usuarioId: usuarios[index % usuarios.length].id,
        },
      })
    )
  )

  for (let index = 0; index < OportunidadesDemo.length; index++) {
    const demo = OportunidadesDemo[index]
    const lead = leads[index % leads.length]
    const usuario = usuarios[index % usuarios.length]
    const motivoPerdaId = demo.motivo ? motivosPorNome[demo.motivo] : null

    const oportunidade = await prisma.oportunidade.create({
      data: {
        titulo: demo.titulo,
        valorEstimado: demo.valor,
        prioridade: demo.prioridade,
        leadId: lead.id,
        usuarioId: usuario.id,
        etapaFunilId: etapaPorNome[demo.etapa],
        motivoPerdaId,
        dataCriacao: daysAgo(
          Object.values(demo.dias).reduce((sum, dias) => sum + dias, 0)
        ),
      },
    })

    const historico = buildHistorico(oportunidade.id, etapas, demo.etapa, demo.dias)
    await prisma.oportunidadeEtapaHistorico.createMany({ data: historico })
  }

  console.log('Seed demo concluído.')
  console.log(`Oportunidades: ${OportunidadesDemo.length}`)
  console.log(`Leads: ${leads.length}`)
  console.log(`Admin: ${SeedConfig.adminEmail} / ${SeedConfig.adminSenha}`)
  console.log('Vendedores: ana@empresa.com e bruno@empresa.com (senha 123456)')
}

main()
  .catch((error) => {
    console.error('Falha no seed demo:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
