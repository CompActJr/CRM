import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { Config } from './config/constants.js'
import { errorHandler } from './middleware/errorHandler.js'
import interacoesRoutes from './routes/interacoes.routes.js'
import authRoutes from './routes/auth.routes.js'
import cargosRoutes from './routes/cargos.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import etapasRoutes from './routes/etapas.routes.js'
import leadsRoutes from './routes/leads.routes.js'
import oportunidadesRoutes from './routes/oportunidades.routes.js'
import motivosPerdaRoutes from './routes/motivosPerda.routes.js'
import relatoriosRoutes from './routes/relatorios.routes.js'
import tarefasRoutes from './routes/tarefas.routes.js'
import propostasRoutes from './routes/propostas.routes.js'
import usuariosRoutes from './routes/usuarios.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (_request, response) => {
  response.json({
    name: 'CRM API',
    endpoints: {
      health: '/health',
      login: 'POST /auth/login',
      leads: '/leads',
      leadsImport: 'POST /leads/import',
      leadsImportTemplate: '/leads/import/template',
      oportunidades: '/oportunidades',
      oportunidadesFunil: '/oportunidades/funil',
      etapasFunil: '/etapas-funil',
      dashboard: '/dashboard',
      relatorios: '/relatorios',
      relatoriosExport: '/relatorios/export',
      usuarios: '/usuarios',
      leadInteracoes: '/leads/:leadId/interacoes',
      oportunidadeInteracoes: '/oportunidades/:oportunidadeId/interacoes',
      oportunidadePerder: 'POST /oportunidades/:id/perder',
      motivosPerda: '/motivos-perda',
      cargos: '/cargos',
      leadTarefas: '/leads/:leadId/tarefas',
      oportunidadeTarefas: '/oportunidades/:oportunidadeId/tarefas',
      tarefas: '/tarefas',
      oportunidadePropostas: '/oportunidades/:oportunidadeId/propostas',
      propostas: '/propostas',
    },
  })
})

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/leads', leadsRoutes)
app.use('/oportunidades', oportunidadesRoutes)
app.use('/etapas-funil', etapasRoutes)
app.use('/motivos-perda', motivosPerdaRoutes)
app.use('/cargos', cargosRoutes)
app.use('/tarefas', tarefasRoutes)
app.use('/propostas', propostasRoutes)
app.use('/relatorios', relatoriosRoutes)
app.use('/interacoes', interacoesRoutes)
app.use('/usuarios', usuariosRoutes)

app.use(errorHandler)

const PORT = Number(process.env.PORT) || 3333;
app.listen({
  port: PORT,
  host: '0.0.0.0' 
}, () => {
  console.log(`Server running on port ${PORT}`);
});