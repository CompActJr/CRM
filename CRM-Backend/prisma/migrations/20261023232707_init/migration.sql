-- CreateEnum
CREATE TYPE "PerfilAcesso" AS ENUM ('Administrador', 'Usuario');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('Ativo', 'Inativo');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('Baixa', 'Media', 'Alta');

-- CreateEnum
CREATE TYPE "InteracaoTipo" AS ENUM ('Ligacao', 'Email', 'Reuniao', 'Nota', 'Registro');

-- CreateEnum
CREATE TYPE "TarefaStatus" AS ENUM ('Pendente', 'Concluida');

-- CreateEnum
CREATE TYPE "PropostaStatus" AS ENUM ('Rascunho', 'Enviada', 'EmNegociacao', 'Aceita', 'Recusada');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "cargo" VARCHAR(80) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil_acesso" "PerfilAcesso" NOT NULL DEFAULT 'Usuario',
    "avatar_url" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motivo_perda" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motivo_perda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapa_funil" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "ordem" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapa_funil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" SERIAL NOT NULL,
    "cnpj" VARCHAR(18),
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180),
    "telefone" VARCHAR(30),
    "empresa" VARCHAR(120),
    "cidade" VARCHAR(80),
    "nicho" VARCHAR(80),
    "observacoes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'Ativo',
    "data_cadastro" DATE NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "valor_estimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'Media',
    "motivo_perda_id" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lead_id" INTEGER NOT NULL,
    "etapa_funil_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio_etapa_historico" (
    "id" SERIAL NOT NULL,
    "negocio_id" INTEGER NOT NULL,
    "etapa_funil_id" INTEGER NOT NULL,
    "entrada_em" TIMESTAMP(3) NOT NULL,
    "saida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_etapa_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposta" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PropostaStatus" NOT NULL DEFAULT 'Rascunho',
    "data_proposta" DATE NOT NULL,
    "observacoes" TEXT,
    "negocio_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "descricao" TEXT,
    "data_prazo" DATE NOT NULL,
    "status" "TarefaStatus" NOT NULL DEFAULT 'Pendente',
    "lead_id" INTEGER NOT NULL,
    "negocio_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacao" (
    "id" SERIAL NOT NULL,
    "tipo" "InteracaoTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "data_interacao" TIMESTAMP(3) NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "negocio_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NegocioToUsuario" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NegocioToUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "motivo_perda_nome_key" ON "motivo_perda"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_nome_key" ON "cargo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "etapa_funil_nome_key" ON "etapa_funil"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "etapa_funil_ordem_key" ON "etapa_funil"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "lead_cnpj_key" ON "lead"("cnpj");

-- CreateIndex
CREATE INDEX "lead_usuario_id_idx" ON "lead"("usuario_id");

-- CreateIndex
CREATE INDEX "lead_data_cadastro_idx" ON "lead"("data_cadastro");

-- CreateIndex
CREATE INDEX "lead_status_idx" ON "lead"("status");

-- CreateIndex
CREATE INDEX "negocio_lead_id_idx" ON "negocio"("lead_id");

-- CreateIndex
CREATE INDEX "negocio_etapa_funil_id_idx" ON "negocio"("etapa_funil_id");

-- CreateIndex
CREATE INDEX "negocio_motivo_perda_id_idx" ON "negocio"("motivo_perda_id");

-- CreateIndex
CREATE INDEX "negocio_etapa_historico_negocio_id_idx" ON "negocio_etapa_historico"("negocio_id");

-- CreateIndex
CREATE INDEX "negocio_etapa_historico_etapa_funil_id_idx" ON "negocio_etapa_historico"("etapa_funil_id");

-- CreateIndex
CREATE INDEX "negocio_etapa_historico_entrada_em_idx" ON "negocio_etapa_historico"("entrada_em");

-- CreateIndex
CREATE INDEX "proposta_negocio_id_idx" ON "proposta"("negocio_id");

-- CreateIndex
CREATE INDEX "proposta_usuario_id_idx" ON "proposta"("usuario_id");

-- CreateIndex
CREATE INDEX "proposta_data_proposta_idx" ON "proposta"("data_proposta");

-- CreateIndex
CREATE INDEX "tarefa_lead_id_idx" ON "tarefa"("lead_id");

-- CreateIndex
CREATE INDEX "tarefa_negocio_id_idx" ON "tarefa"("negocio_id");

-- CreateIndex
CREATE INDEX "tarefa_usuario_id_idx" ON "tarefa"("usuario_id");

-- CreateIndex
CREATE INDEX "tarefa_data_prazo_idx" ON "tarefa"("data_prazo");

-- CreateIndex
CREATE INDEX "tarefa_status_idx" ON "tarefa"("status");

-- CreateIndex
CREATE INDEX "interacao_lead_id_idx" ON "interacao"("lead_id");

-- CreateIndex
CREATE INDEX "interacao_negocio_id_idx" ON "interacao"("negocio_id");

-- CreateIndex
CREATE INDEX "interacao_usuario_id_idx" ON "interacao"("usuario_id");

-- CreateIndex
CREATE INDEX "interacao_data_interacao_idx" ON "interacao"("data_interacao");

-- CreateIndex
CREATE INDEX "_NegocioToUsuario_B_index" ON "_NegocioToUsuario"("B");

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio" ADD CONSTRAINT "negocio_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio" ADD CONSTRAINT "negocio_etapa_funil_id_fkey" FOREIGN KEY ("etapa_funil_id") REFERENCES "etapa_funil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio" ADD CONSTRAINT "negocio_motivo_perda_id_fkey" FOREIGN KEY ("motivo_perda_id") REFERENCES "motivo_perda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_etapa_historico" ADD CONSTRAINT "negocio_etapa_historico_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_etapa_historico" ADD CONSTRAINT "negocio_etapa_historico_etapa_funil_id_fkey" FOREIGN KEY ("etapa_funil_id") REFERENCES "etapa_funil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacao" ADD CONSTRAINT "interacao_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacao" ADD CONSTRAINT "interacao_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacao" ADD CONSTRAINT "interacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NegocioToUsuario" ADD CONSTRAINT "_NegocioToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NegocioToUsuario" ADD CONSTRAINT "_NegocioToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
