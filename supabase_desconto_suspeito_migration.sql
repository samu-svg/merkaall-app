-- Bloqueia promoções com desconto inflado (preço "De" falso das lojas).
-- Execute no Supabase SQL Editor após as demais migrações.
--
-- Regras (espelham lib/promoFormat.ts):
--   DESCONTO_PERCENTUAL_MAX_CONFIAVEL = 85
--   PRECO_RATIO_MAX_CONFIAVEL       = 8

CREATE OR REPLACE FUNCTION public.promocao_desconto_suspeito(
  p_preco_original numeric,
  p_preco_desconto numeric,
  p_percentual_desconto numeric
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    COALESCE(p_preco_desconto, 0) <= 0
    OR COALESCE(p_preco_original, 0) <= COALESCE(p_preco_desconto, 0)
    OR COALESCE(p_percentual_desconto, 0) >= 85
    OR (
      COALESCE(p_preco_desconto, 0) > 0
      AND COALESCE(p_preco_original, 0) / p_preco_desconto > 8
    );
$$;

COMMENT ON FUNCTION public.promocao_desconto_suspeito(numeric, numeric, numeric) IS
  'Detecta promoções enganosas (desconto >= 85% ou razão preço original/atual > 8).';

-- Remove promoções falsas já gravadas (salvos em promocoes_salvas são removidos em CASCADE).
DELETE FROM public.promocoes
WHERE public.promocao_desconto_suspeito(preco_original, preco_desconto, percentual_desconto);

CREATE OR REPLACE FUNCTION public.trg_bloquear_promocao_desconto_suspeito()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.promocao_desconto_suspeito(
    NEW.preco_original,
    NEW.preco_desconto,
    NEW.percentual_desconto
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bloquear_promocao_desconto_suspeito ON public.promocoes;
CREATE TRIGGER bloquear_promocao_desconto_suspeito
  BEFORE INSERT OR UPDATE OF preco_original, preco_desconto, percentual_desconto
  ON public.promocoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bloquear_promocao_desconto_suspeito();

-- buscar_promocoes: não retorna suspeitas mesmo se aprovada=true manualmente
CREATE OR REPLACE FUNCTION public.buscar_promocoes(termo text, limite int DEFAULT 50, offset_val int DEFAULT 0)
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
    AND NOT public.promocao_desconto_suspeito(p.preco_original, p.preco_desconto, p.percentual_desconto)
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
