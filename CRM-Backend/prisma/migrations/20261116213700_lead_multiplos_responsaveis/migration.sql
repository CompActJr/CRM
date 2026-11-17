-- CreateTable
CREATE TABLE IF NOT EXISTS "_LeadResponsaveis" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LeadResponsaveis_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_LeadResponsaveis_B_index" ON "_LeadResponsaveis"("B");

-- AddForeignKey
ALTER TABLE "_LeadResponsaveis" ADD CONSTRAINT "_LeadResponsaveis_A_fkey" FOREIGN KEY ("A") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadResponsaveis" ADD CONSTRAINT "_LeadResponsaveis_B_fkey" FOREIGN KEY ("B") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: registra o responsável atual de cada lead
INSERT INTO "_LeadResponsaveis" ("A", "B")
SELECT "id", "usuario_id" FROM "lead"
ON CONFLICT DO NOTHING;

