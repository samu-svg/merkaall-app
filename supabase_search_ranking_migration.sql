-- Opcional: melhora ranking FTS (título pesa mais que descrição).
-- Execute no Supabase SQL Editor após supabase_search_migration.sql

CREATE OR REPLACE FUNCTION atualizar_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.titulo, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.descricao, ''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.categoria, ''))), 'C') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.loja, ''))), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE promocoes SET search_vector =
  setweight(to_tsvector('portuguese', unaccent(coalesce(titulo, ''))), 'A') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(descricao, ''))), 'B') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(categoria, ''))), 'C') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(loja, ''))), 'D');

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
DECLARE
  tsquery_val tsquery;
  termo_norm text;
BEGIN
  termo_norm := unaccent(lower(trim(termo)));
  BEGIN
    tsquery_val := plainto_tsquery('portuguese', termo_norm);
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
    ts_rank_cd(p.search_vector, tsquery_val, 32) AS relevancia
  FROM promocoes p
  WHERE p.aprovada = true
    AND (
      p.search_vector @@ tsquery_val
      OR unaccent(lower(p.titulo)) ILIKE '%' || termo_norm || '%'
      OR unaccent(lower(coalesce(p.descricao, ''))) ILIKE '%' || termo_norm || '%'
      OR unaccent(lower(coalesce(p.categoria, ''))) ILIKE '%' || termo_norm || '%'
    )
  ORDER BY
    CASE
      WHEN termo_norm IN ('celular', 'smartphone', 'iphone')
           AND (
             unaccent(lower(p.titulo)) ~ '(carregador|capa|pelicula|película|cabo|para celular|compativel|compatível|suporte|inducao|indução)'
             AND unaccent(lower(p.titulo)) !~ '(smartphone|iphone|galaxy [a-z]?[0-9]|redmi|motorola|xiaomi|\d{2,3}\s*gb)'
           ) THEN 0
      ELSE 1
    END DESC,
    relevancia DESC,
    p.criada_em DESC
  LIMIT limite OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
