# CRM Compact.Jr

CRM acadêmico desenvolvido no Projeto Integrador — gestão de leads, negócios, funil de vendas, tarefas, interações e propostas.

**Repositório:** [github.com/PabloAntonioCorrea/CRM_Projeto-Integrador](https://github.com/PabloAntonioCorrea/CRM_Projeto-Integrador.git)

## Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express, Prisma
- **Banco:** MySQL 8

## Início rápido (Docker)

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Acesse http://localhost:8080 — login: `admin@empresa.com` / `123456`

Instruções completas em [DEPLOY.md](./DEPLOY.md).

## Desenvolvimento local

### Backend

```powershell
cd CRM-Backend
npm ci
Copy-Item .env.example .env
npm run db:reset
npm run dev
```

### Frontend

```powershell
cd CRM-Frontend
npm ci
npm run dev
```

## Estrutura

```
CRM-Backend/     API REST + Prisma
CRM-Frontend/    Interface React
docker-compose.yml
DEPLOY.md        Guia de implantação
```
