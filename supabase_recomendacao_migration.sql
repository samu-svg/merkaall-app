-- ============================================================
-- Sistema de Recomendação Inteligente — PromoçõesPro
-- Execute no Supabase SQL Editor ANTES de usar o app
-- ============================================================

-- 1. Eventos de comportamento do usuário
CREATE TABLE IF NOT EXISTS user_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  promocao_id text NOT NULL,
  event_type  text NOT NULL,  -- 'click','view','open_link','favorite','search','skip'
  peso        int  NOT NULL DEFAULT 1,
  categoria   text,
  preco       numeric,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_cat  ON user_events(user_id, categoria);

-- 2. Perfil do usuário (scores por categoria)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id          text PRIMARY KEY,
  scores           jsonb DEFAULT '{}',
  faixa_preco_min  numeric DEFAULT 0,
  faixa_preco_max  numeric DEFAULT 999999,
  total_eventos    int DEFAULT 0,
  updated_at       timestamptz DEFAULT now()
);

-- 3. Função que recalcula o perfil com decay temporal
CREATE OR REPLACE FUNCTION recalcular_perfil(p_user_id text)
RETURNS void AS $$
DECLARE
  novo_scores jsonb := '{}';
  nova_min    numeric;
  nova_max    numeric;
  total       int;
BEGIN
  SELECT
    jsonb_object_agg(
      categoria,
      ROUND(SUM(peso * EXP(-0.1 * EXTRACT(EPOCH FROM (now() - created_at)) / 86400))::numeric, 2)
    )
  INTO novo_scores
  FROM user_events
  WHERE user_id = p_user_id
    AND categoria IS NOT NULL
    AND created_at > now() - interval '30 days';

  SELECT
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY preco),
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY preco)
  INTO nova_min, nova_max
  FROM user_events
  WHERE user_id = p_user_id AND preco IS NOT NULL;

  SELECT COUNT(*) INTO total FROM user_events WHERE user_id = p_user_id;

  INSERT INTO user_profiles (user_id, scores, faixa_preco_min, faixa_preco_max, total_eventos, updated_at)
  VALUES (p_user_id, COALESCE(novo_scores, '{}'), COALESCE(nova_min, 0), COALESCE(nova_max, 999999), total, now())
  ON CONFLICT (user_id) DO UPDATE SET
    scores          = COALESCE(novo_scores, '{}'),
    faixa_preco_min = COALESCE(nova_min, 0),
    faixa_preco_max = COALESCE(nova_max, 999999),
    total_eventos   = total,
    updated_at      = now();
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger: recalcula o perfil a cada novo evento
CREATE OR REPLACE FUNCTION trigger_recalcular_perfil()
RETURNS trigger AS $$
BEGIN
  PERFORM recalcular_perfil(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_perfil ON user_events;
CREATE TRIGGER trg_recalcular_perfil
  AFTER INSERT ON user_events
  FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_perfil();

-- 5. Função principal de recomendação (80% relevância + 20% descoberta)
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
      p.foto_url, p.link_afiliado, p.loja, p.categoria,
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

  -- 80%: promoções pontuadas pelo perfil
  RETURN QUERY
  SELECT
    p.id::text, p.titulo, p.descricao,
    p.preco_original, p.preco_desconto, p.percentual_desconto::numeric,
    p.foto_url, p.link_afiliado, p.loja, p.categoria,
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

  -- 20%: promoções de descoberta
  RETURN QUERY
  SELECT
    p.id::text, p.titulo, p.descricao,
    p.preco_original, p.preco_desconto, p.percentual_desconto::numeric,
    p.foto_url, p.link_afiliado, p.loja, p.categoria,
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
