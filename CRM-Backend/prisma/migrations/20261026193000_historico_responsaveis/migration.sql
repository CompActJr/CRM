-- CreateTable
CREATE TABLE "lead_responsavel_historico" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "entrada_em" TIMESTAMP(3) NOT NULL,
    "saida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_responsavel_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio_responsavel_historico" (
    "id" SERIAL NOT NULL,
    "negocio_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "entrada_em" TIMESTAMP(3) NOT NULL,
    "saida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_responsavel_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_responsavel_historico_lead_id_idx" ON "lead_responsavel_historico"("lead_id");

-- CreateIndex
CREATE INDEX "lead_responsavel_historico_usuario_id_idx" ON "lead_responsavel_historico"("usuario_id");

-- CreateIndex
CREATE INDEX "lead_responsavel_historico_entrada_em_idx" ON "lead_responsavel_historico"("entrada_em");

-- CreateIndex
CREATE INDEX "negocio_responsavel_historico_negocio_id_idx" ON "negocio_responsavel_historico"("negocio_id");

-- CreateIndex
CREATE INDEX "negocio_responsavel_historico_usuario_id_idx" ON "negocio_responsavel_historico"("usuario_id");

-- CreateIndex
CREATE INDEX "negocio_responsavel_historico_entrada_em_idx" ON "negocio_responsavel_historico"("entrada_em");

-- AddForeignKey
ALTER TABLE "lead_responsavel_historico" ADD CONSTRAINT "lead_responsavel_historico_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_responsavel_historico" ADD CONSTRAINT "lead_responsavel_historico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_responsavel_historico" ADD CONSTRAINT "negocio_responsavel_historico_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_responsavel_historico" ADD CONSTRAINT "negocio_responsavel_historico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill: registra o responsável atual como ponto inicial do histórico
INSERT INTO "lead_responsavel_historico" ("lead_id", "usuario_id", "entrada_em")
SELECT "id", "usuario_id", COALESCE("data_cadastro"::timestamp, "created_at")
FROM "lead";

INSERT INTO "negocio_responsavel_historico" ("negocio_id", "usuario_id", "entrada_em")
SELECT "negocio"."id", "_NegocioToUsuario"."B", "negocio"."data_criacao"
FROM "negocio"
INNER JOIN "_NegocioToUsuario" ON "_NegocioToUsuario"."A" = "negocio"."id";
