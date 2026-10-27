-- A entrada inicial do responsável vem de "lead"."data_cadastro" (DATE, sem hora).
-- Fixar meio-dia UTC mantém o dia correto em qualquer fuso ao formatar com data e hora.
UPDATE "lead_responsavel_historico" AS "historico"
SET "entrada_em" = ("lead"."data_cadastro" + time '12:00')
FROM "lead"
WHERE "historico"."lead_id" = "lead"."id"
  AND "historico"."saida_em" IS NULL
  AND "historico"."entrada_em" = "lead"."data_cadastro"::timestamp;
