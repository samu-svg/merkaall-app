-- Galeria de fotos por promoção (execute no Supabase SQL Editor)
-- O scraper/site deve passar a preencher fotos_urls com todas as imagens do anúncio.

ALTER TABLE promocoes
  ADD COLUMN IF NOT EXISTS fotos_urls text[] DEFAULT '{}';

-- Backfill: capa atual vira primeiro item da galeria
UPDATE promocoes
SET fotos_urls = ARRAY[foto_url]
WHERE (fotos_urls IS NULL OR cardinality(fotos_urls) = 0)
  AND foto_url IS NOT NULL
  AND trim(foto_url) <> '';

COMMENT ON COLUMN promocoes.fotos_urls IS 'URLs das fotos do produto (ordem da galeria); foto_url permanece como capa do feed';
