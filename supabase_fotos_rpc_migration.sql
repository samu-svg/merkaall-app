-- Inclui fotos_urls nas RPCs (execute no SQL Editor após supabase_fotos_migration.sql)

DROP FUNCTION IF EXISTS public.buscar_promocoes(text, int, int);
DROP FUNCTION IF EXISTS public.buscar_promocoes(text, integer, integer);
DROP FUNCTION IF EXISTS public.recomendar_promocoes(text, int);
DROP FUNCTION IF EXISTS public.recomendar_promocoes(text, integer);

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
  fotos_urls jsonb,
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
    COALESCE(to_jsonb(p.fotos_urls), '[]'::jsonb),
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

CREATE OR REPLACE FUNCTION recomendar_promocoes(
  p_user_id   text,
  p_limite    int DEFAULT 30
)
RETURNS TABLE (
  id                  text,
  titulo              text,
  descricao           text,
  preco_original      numeric,
  preco_desconto      numeric,
  percentual_desconto numeric,
  foto_url            text,
  fotos_urls          jsonb,
  link_afiliado       text,
  loja                text,
  categoria           text,
  avaliacao           numeric,
  aprovada            boolean,
  criada_em           timestamptz,
  score               numeric,
  tipo                text
) AS $$
DECLARE
  perfil         user_profiles%ROWTYPE;
  limite_rel     int;
  limite_desc    int;
  tem_perfil     boolean;
BEGIN
  SELECT * INTO perfil FROM user_profiles WHERE user_id = p_user_id;
  tem_perfil := FOUND AND perfil.total_eventos >= 3;

  limite_rel  := CEIL(p_limite * 0.8);
  limite_desc := p_limite - limite_rel;

  IF NOT tem_perfil THEN
    RETURN QUERY
    SELECT
      p.id::text, p.titulo, p.descricao,
      p.preco_original, p.preco_desconto, p.percentual_desconto::numeric,
      p.foto_url, COALESCE(to_jsonb(p.fotos_urls), '[]'::jsonb), p.link_afiliado, p.loja, p.categoria,
      p.avaliacao::numeric, p.aprovada, p.criada_em::timestamptz,
      p.percentual_desconto::numeric AS score,
      'descoberta'::text AS tipo
    FROM promocoes p
    WHERE p.aprovada = true
      AND p.criada_em::timestamptz > now() - interval '7 days'
    ORDER BY score DESC, p.criada_em DESC
    LIMIT p_limite;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id::text, p.titulo, p.descricao,
    p.preco_original, p.preco_desconto, p.percentual_desconto::numeric,
    p.foto_url, COALESCE(to_jsonb(p.fotos_urls), '[]'::jsonb), p.link_afiliado, p.loja, p.categoria,
    p.avaliacao::numeric, p.aprovada, p.criada_em::timestamptz,
    ROUND((
      COALESCE((perfil.scores->p.categoria)::numeric, 0) * 2.0
      + CASE WHEN p.preco_desconto BETWEEN perfil.faixa_preco_min AND perfil.faixa_preco_max THEN 5 ELSE 0 END
      + p.percentual_desconto::numeric * 0.3
    )::numeric, 2) AS score,
    'relevante'::text AS tipo
  FROM promocoes p
  WHERE p.aprovada = true
    AND p.id::text NOT IN (
      SELECT DISTINCT promocao_id FROM user_events
      WHERE user_id = p_user_id AND created_at > now() - interval '3 days'
    )
  ORDER BY score DESC
  LIMIT limite_rel;

  RETURN QUERY
  SELECT
    p.id::text, p.titulo, p.descricao,
    p.preco_original, p.preco_desconto, p.percentual_desconto::numeric,
    p.foto_url, COALESCE(to_jsonb(p.fotos_urls), '[]'::jsonb), p.link_afiliado, p.loja, p.categoria,
    p.avaliacao::numeric, p.aprovada, p.criada_em::timestamptz,
    0::numeric AS score,
    'descoberta'::text AS tipo
  FROM promocoes p
  WHERE p.aprovada = true
    AND p.id::text NOT IN (
      SELECT DISTINCT promocao_id FROM user_events
      WHERE user_id = p_user_id AND created_at > now() - interval '3 days'
    )
    AND (
      perfil.scores->p.categoria IS NULL
      OR (perfil.scores->p.categoria)::numeric < 2
    )
  ORDER BY RANDOM()
  LIMIT limite_desc;
END;
$$ LANGUAGE plpgsql;
