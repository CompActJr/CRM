# CRM Compact.Jr — Guia de Deploy

Documento de implantação do **CRM Compact.Jr** (Projeto Integrador). Repositório: [github.com/PabloAntonioCorrea/CRM_Projeto-Integrador](https://github.com/PabloAntonioCorrea/CRM_Projeto-Integrador.git).

## Visão geral

| Componente | Tecnologia | Porta padrão |
|------------|------------|--------------|
| Frontend | React + Vite + Nginx | 8080 |
| API | Node.js + Express + Prisma | 3333 |
| Banco | PostgreSQL (Supabase / AWS RDS) | 5432 / 6543 |

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) ou Docker Engine + Docker Compose (Linux)
- Git (para clonar o repositório)

## Deploy com Docker Compose (recomendado)

### 1. Clonar o repositório

```powershell
git clone https://github.com/PabloAntonioCorrea/CRM_Projeto-Integrador.git
cd CRM_Projeto-Integrador
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo na raiz do projeto:

```powershell
Copy-Item .env.example .env
```

Variáveis disponíveis:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de Conexão com Pooling (porta 6543) | `postgresql://user:pass@host:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | String de Conexão Direta (porta 5432) | `postgresql://user:pass@host:5432/postgres` |
| `VITE_API_URL` | URL da API usada no build do frontend | `http://localhost:3333` |

### 3. Subir os serviços

```powershell
docker compose up --build -d
```

O compose iniciará os serviços:
1. **api** — Backend Node; sincroniza o schema PostgreSQL (`npx prisma db push`) e executa a carga inicial automática se o banco estiver limpo.
2. **frontend** — React compilado e servido via Nginx na porta `8080`.

### 4. Acessar a aplicação

- **Frontend:** http://localhost:8080
- **API Health:** http://localhost:3333/health

### Usuário administrador padrão

Após a primeira execução do container `api`:

- **E-mail:** `admin@empresa.com`
- **Senha:** `123456`
