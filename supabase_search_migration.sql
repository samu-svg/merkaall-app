-- Execute no Supabase SQL Editor: https://supabase.com/dashboard
-- Habilita Full-Text Search com ranking de relevância

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE promocoes SET search_vector = to_tsvector(
  'portuguese',
  unaccent(coalesce(titulo, '')) || ' ' ||
  unaccent(coalesce(descricao, '')) || ' ' ||
  unaccent(coalesce(categoria, '')) || ' ' ||
  unaccent(coalesce(loja, ''))
);

CREATE INDEX IF NOT EXISTS idx_promocoes_search ON promocoes USING GIN (search_vector);

CREATE OR REPLACE FUNCTION atualizar_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese',
    unaccent(coalesce(NEW.titulo, '')) || ' ' ||
    unaccent(coalesce(NEW.descricao, '')) || ' ' ||
    unaccent(coalesce(NEW.categoria, '')) || ' ' ||
    unaccent(coalesce(NEW.loja, ''))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_search_vector ON promocoes;
CREATE TRIGGER trigger_search_vector BEFORE INSERT OR UPDATE ON promocoes
  FOR EACH ROW EXECUTE FUNCTION atualizar_search_vector();

CREATE OR REPLACE FUNCTION buscar_promocoes(termo text, limite int DEFAULT 50, offset_val int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  external_id text,
  titulo text,
  descricao text,
  preco_original numeric,
  preco_desconto numeric,
  percentual_desconto numeric,
  foto_url text,
  link_afiliado text,
  loja text,
  categoria text,
  avaliacao numeric,
  aprovada boolean,
  criada_em timestamptz,
  expires_at timestamptz,
  frete_gratis boolean,
  relevancia real
) AS $$
DECLARE tsquery_val tsquery;
BEGIN
  BEGIN
    tsquery_val := plainto_tsquery('portuguese', unaccent(lower(trim(termo))));
  EXCEPTION WHEN others THEN
    tsquery_val := plainto_tsquery('portuguese', 'produto');
  END;
  RETURN QUERY
  SELECT
    p.id,
    p.external_id,
    p.titulo,
    p.descricao,
    p.preco_original,
    p.preco_desconto,
    p.percentual_desconto,
    p.foto_url,
    p.link_afiliado,
    p.loja,
    p.categoria,
    p.avaliacao,
    p.aprovada,
    p.criada_em,
    p.expires_at,
    p.frete_gratis,
    ts_rank(p.search_vector, tsquery_val) AS relevancia
  FROM promocoes p
  WHERE p.aprovada = true
    AND (
      p.search_vector @@ tsquery_val
      OR unaccent(lower(p.titulo)) ILIKE '%' || unaccent(lower(trim(termo))) || '%'
      OR unaccent(lower(coalesce(p.descricao, ''))) ILIKE '%' || unaccent(lower(trim(termo))) || '%'
      OR unaccent(lower(coalesce(p.categoria, ''))) ILIKE '%' || unaccent(lower(trim(termo))) || '%'
    )
  ORDER BY relevancia DESC, p.criada_em DESC
  LIMIT limite OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
