-- Execute no Supabase SQL Editor (ou via supabase db push no promoçõesPro)
-- Multi-marketplace: loja obrigatória + dedup por (loja, external_id)

UPDATE promocoes
SET loja = 'Mercado Livre'
WHERE loja IS NULL OR trim(loja) = '';

ALTER TABLE promocoes
  ALTER COLUMN loja SET DEFAULT 'Mercado Livre';

ALTER TABLE promocoes
  ALTER COLUMN loja SET NOT NULL;

ALTER TABLE promocoes
  DROP CONSTRAINT IF EXISTS promocoes_external_id_key;

DROP INDEX IF EXISTS promocoes_loja_external_id_uidx;

ALTER TABLE promocoes
  DROP CONSTRAINT IF EXISTS promocoes_loja_external_id_key;

ALTER TABLE promocoes
  ADD CONSTRAINT promocoes_loja_external_id_key UNIQUE (loja, external_id);

CREATE INDEX IF NOT EXISTS idx_promocoes_feed_loja
  ON promocoes (aprovada, loja, percentual_desconto DESC)
  WHERE aprovada = true;

CREATE INDEX IF NOT EXISTS idx_promocoes_feed_categoria
  ON promocoes (aprovada, categoria, percentual_desconto DESC)
  WHERE aprovada = true;
