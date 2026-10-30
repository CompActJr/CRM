-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "ativar_meta_leads" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ativar_metas_negociacoes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meta_periodo_fim" DATE,
ADD COLUMN     "meta_periodo_inicio" DATE,
ADD COLUMN     "quantidade_leads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantidade_negociacoes" INTEGER NOT NULL DEFAULT 0;
