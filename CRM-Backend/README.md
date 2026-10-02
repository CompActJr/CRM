# CRM API

Backend Node.js com Prisma e MySQL (`crm_integrador`).

## Pré-requisitos

- Node.js 20+
- MySQL rodando com o schema `crm_integrador` criado (pode estar vazio, sem tabelas)

## Configuração (uma vez)

1. Copie o arquivo de ambiente:

```powershell
cd "c:\Users\Pablo\Desktop\Projeto Integrador\CRM-Backend"
copy .env.example .env
```

2. Edite o `.env` e coloque seu usuário e senha do MySQL:

```env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/crm_integrador"
PORT=3333
```

3. Instale dependências:

```powershell
npm install
```

## Banco de dados (Prisma)

| Arquivo / pasta | Função |
|-----------------|--------|
| `prisma/schema.prisma` | Modelo atual das tabelas |
| `prisma/migrations/` | Histórico de alterações (fonte oficial do schema) |
| `prisma/seed.js` | Dados iniciais de desenvolvimento |

## Criar tabelas (migration)

No terminal do VS Code, dentro de `CRM-Backend`:

```powershell
npm run db:migrate
```

Isso aplica todas as migrations em `prisma/migrations/` no schema `crm_integrador`. Confira no MySQL Workbench em **Tables**.

## Popular dados (seed)

```powershell
npm run db:seed
```

Conta inicial de administrador:

| E-mail | Senha |
|--------|-------|
| `admin@empresa.com` | `123456` |

O seed também cria as etapas do funil e motivos de perda padrão. Leads, negocios e demais dados devem ser cadastrados pelo sistema.

## Zerar o banco e começar do zero

```powershell
npm run db:reset
```

Apaga todos os dados, reaplica as migrations e roda o seed mínimo (só admin + configurações do funil).

## Subir a API

```powershell
npm run dev
```

Teste:

```powershell
irm http://localhost:3333/health
irm http://localhost:3333/leads
irm http://localhost:3333/usuarios
```

Login (seed):

```powershell
$body = @{ email = 'admin@empresa.com'; senha = '123456' } | ConvertTo-Json
irm http://localhost:3333/auth/login -Method POST -Body $body -ContentType 'application/json'
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login |
| GET | `/leads` | Listar leads |
| GET | `/leads/:id` | Buscar lead |
| POST | `/leads` | Criar lead |
| PUT | `/leads/:id` | Atualizar lead |
| DELETE | `/leads/:id` | Excluir lead |
| GET | `/usuarios` | Listar usuários |

## Comandos úteis

| Comando | O que faz |
|---------|-----------|
| `npm run db:migrate` | Aplica migrations (cria/altera tabelas) |
| `npm run db:seed` | Insere dados iniciais |
| `npm run db:studio` | Interface visual do Prisma |
| `npm run dev` | API em modo desenvolvimento |
