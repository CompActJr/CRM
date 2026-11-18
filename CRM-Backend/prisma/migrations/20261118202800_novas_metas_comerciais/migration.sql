-- AlterTable
ALTER TABLE "usuario"
  ADD COLUMN IF NOT EXISTS "ativar_meta_entradas_contato" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ativar_meta_diagnosticos" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "quantidade_entradas_contato" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "quantidade_diagnosticos" INTEGER NOT NULL DEFAULT 0,
  DROP COLUMN IF EXISTS "ativar_metas_negociacoes",
  DROP COLUMN IF EXISTS "quantidade_negociacoes";

