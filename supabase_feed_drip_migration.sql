-- ============================================================
-- Feed "drip" — publicação gotejada de promoções no feed
-- ============================================================
--
-- OBJETIVO
--   Fazer a aba Feed (que já é tempo real, estilo grupo de WhatsApp)
--   receber promoções NOVAS aos poucos, em intervalos VARIADOS
--   (ex.: uma em 5 min, a próxima em 8 min, etc.), em vez de despejar
--   um lote inteiro de uma vez.
--
-- COMO FUNCIONA
--   1. O scraper deixa de inserir direto em `promocoes` e passa a
--      inserir em `promocoes_fila` (fila de espera).
--   2. Um job pg_cron roda de minuto em minuto e chama
--      `publicar_proxima_promo()`.
--   3. A função só publica quando já passou o horário agendado
--      (`feed_drip_control.proxima_publicacao_em`). Ao publicar, ela
--      escolhe a promo MAIS RECENTE da fila (com piso de qualidade e
--      ignorando ofertas expiradas), INSERE em `promocoes`
--      (aprovada = true, criada_em = now()) e reagenda o próximo
--      disparo com um intervalo ALEATÓRIO entre gap_min e gap_max.
--      A cada ciclo também descarta da fila ofertas expiradas ou
--      encalhadas (enfileiradas há mais de `descartar_apos_horas`),
--      para a fila não inchar quando o volume do scraper é alto.
--   4. Como o app já escuta INSERT em `promocoes` via Supabase Realtime
--      (hooks/usePromocoesFeed.ts), a promo aparece no topo do feed de
--      todos os usuários no instante da publicação — SEM mudar o app.
--
-- Não interfere no fluxo de aprovação/IA: envie para a fila apenas o
-- que já está pronto para ir ao ar.
--
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- ============================================================


-- ------------------------------------------------------------
-- 1) Tabela de fila (espelha os campos que o scraper preenche)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promocoes_fila (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id         TEXT,
  titulo              TEXT NOT NULL,
  descricao           TEXT,
  preco_original      NUMERIC NOT NULL,
  preco_desconto      NUMERIC NOT NULL,
  percentual_desconto NUMERIC NOT NULL,
  foto_url            TEXT,
  fotos_urls          TEXT[] DEFAULT '{}'::text[],
  link_afiliado       TEXT NOT NULL,
  loja                TEXT NOT NULL DEFAULT 'Mercado Livre'::text,
  categoria           TEXT,
  avaliacao           NUMERIC,
  frete_gratis        BOOLEAN NOT NULL DEFAULT false,
  expires_at          TIMESTAMPTZ,
  enfileirada_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedup: mesmo item da mesma loja não entra duas vezes na fila.
-- (external_id NULL é permitido; NULLs são considerados distintos.)
CREATE UNIQUE INDEX IF NOT EXISTS promocoes_fila_loja_external_id_uidx
  ON public.promocoes_fila (loja, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS promocoes_fila_enfileirada_em_idx
  ON public.promocoes_fila (enfileirada_em ASC);

-- Fila é área interna: só service role (scraper/cron) acessa.
ALTER TABLE public.promocoes_fila ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas de propósito: anon/authenticated não leem a fila.
-- O scraper insere usando a SERVICE ROLE KEY (bypassa RLS).


-- ------------------------------------------------------------
-- 2) Tabela de controle (singleton) — ajuste o ritmo aqui
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_drip_control (
  id                    SMALLINT PRIMARY KEY DEFAULT 1,
  ativo                 BOOLEAN NOT NULL DEFAULT true,     -- liga/desliga o gotejamento
  gap_min_minutos       INT NOT NULL DEFAULT 5,            -- intervalo mínimo entre publicações
  gap_max_minutos       INT NOT NULL DEFAULT 8,            -- intervalo máximo entre publicações
  lote_por_ciclo        INT NOT NULL DEFAULT 1,            -- quantas promos publicar por disparo
  descartar_apos_horas  INT NOT NULL DEFAULT 24,           -- descarta da fila o que ficou encalhado
  proxima_publicacao_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_publicacao_em  TIMESTAMPTZ,
  CONSTRAINT feed_drip_control_singleton CHECK (id = 1)
);

INSERT INTO public.feed_drip_control (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.feed_drip_control ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas: apenas service role/cron manipulam.


-- ------------------------------------------------------------
-- 3) Função que publica a próxima promo (respeitando o intervalo)
-- ------------------------------------------------------------
-- Retorna quantas promoções foram publicadas neste ciclo (0 quando
-- ainda não é hora ou a fila está vazia).
CREATE OR REPLACE FUNCTION public.publicar_proxima_promo()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ctrl        public.feed_drip_control%ROWTYPE;
  item        public.promocoes_fila%ROWTYPE;
  publicadas  INT := 0;
  gap         INT;
BEGIN
  -- Trava a linha de controle para evitar corrida entre disparos.
  SELECT * INTO ctrl FROM public.feed_drip_control WHERE id = 1 FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.feed_drip_control (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    SELECT * INTO ctrl FROM public.feed_drip_control WHERE id = 1 FOR UPDATE;
  END IF;

  IF NOT ctrl.ativo THEN
    RETURN 0;
  END IF;

  -- Limpeza: remove da fila ofertas expiradas ou encalhadas (evita inchar
  -- a fila e nunca publicar oferta velha quando o volume é alto).
  DELETE FROM public.promocoes_fila f
  WHERE (f.expires_at IS NOT NULL AND f.expires_at <= now())
     OR f.enfileirada_em < now() - make_interval(hours => GREATEST(1, ctrl.descartar_apos_horas));

  -- Ainda não chegou a hora do próximo "gota".
  IF ctrl.proxima_publicacao_em > now() THEN
    RETURN 0;
  END IF;

  -- Prioriza as MAIS RECENTES, mantendo um piso de qualidade
  -- (exclui desconto suspeito, mesma regra do app / feedQuery) e
  -- ignorando ofertas já expiradas.
  FOR item IN
    SELECT f.*
    FROM public.promocoes_fila f
    WHERE f.preco_desconto > 0
      AND f.preco_original > f.preco_desconto
      AND f.percentual_desconto < 85
      AND (f.preco_original / NULLIF(f.preco_desconto, 0)) <= 8
      AND (f.expires_at IS NULL OR f.expires_at > now())
    ORDER BY f.enfileirada_em DESC
    LIMIT GREATEST(1, ctrl.lote_por_ciclo)
  LOOP
    INSERT INTO public.promocoes (
      external_id, titulo, descricao, preco_original, preco_desconto,
      percentual_desconto, foto_url, fotos_urls, link_afiliado, loja,
      categoria, avaliacao, frete_gratis, expires_at, aprovada, criada_em
    ) VALUES (
      item.external_id, item.titulo, item.descricao, item.preco_original, item.preco_desconto,
      item.percentual_desconto, item.foto_url, COALESCE(item.fotos_urls, '{}'::text[]),
      item.link_afiliado, item.loja, item.categoria, item.avaliacao, item.frete_gratis,
      item.expires_at, true, now()
    )
    ON CONFLICT (loja, external_id) DO NOTHING;

    -- Sai da fila de qualquer forma (publicou ou já existia em promocoes).
    DELETE FROM public.promocoes_fila WHERE id = item.id;
    publicadas := publicadas + 1;
  END LOOP;

  -- Só reagenda se realmente publicou algo; se a fila estava vazia,
  -- tenta de novo no próximo minuto sem "queimar" o intervalo.
  IF publicadas > 0 THEN
    gap := ctrl.gap_min_minutos
           + FLOOR(
               random() * (
                 GREATEST(ctrl.gap_max_minutos, ctrl.gap_min_minutos)
                 - ctrl.gap_min_minutos + 1
               )
             )::INT;

    UPDATE public.feed_drip_control
       SET proxima_publicacao_em = now() + make_interval(mins => gap),
           ultima_publicacao_em  = now()
     WHERE id = 1;
  END IF;

  RETURN publicadas;
END;
$$;


-- ------------------------------------------------------------
-- 4) Helper opcional para o scraper enfileirar via RPC
-- ------------------------------------------------------------
-- O scraper pode simplesmente fazer INSERT em public.promocoes_fila,
-- OU chamar esta função (útil se preferir uma RPC estável).
CREATE OR REPLACE FUNCTION public.enfileirar_promocao(
  p_titulo              TEXT,
  p_preco_original      NUMERIC,
  p_preco_desconto      NUMERIC,
  p_percentual_desconto NUMERIC,
  p_link_afiliado       TEXT,
  p_loja                TEXT DEFAULT 'Mercado Livre',
  p_external_id         TEXT DEFAULT NULL,
  p_descricao           TEXT DEFAULT NULL,
  p_foto_url            TEXT DEFAULT NULL,
  p_fotos_urls          TEXT[] DEFAULT '{}'::text[],
  p_categoria           TEXT DEFAULT NULL,
  p_avaliacao           NUMERIC DEFAULT NULL,
  p_frete_gratis        BOOLEAN DEFAULT false,
  p_expires_at          TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_id UUID;
BEGIN
  INSERT INTO public.promocoes_fila (
    external_id, titulo, descricao, preco_original, preco_desconto,
    percentual_desconto, foto_url, fotos_urls, link_afiliado, loja,
    categoria, avaliacao, frete_gratis, expires_at
  ) VALUES (
    p_external_id, p_titulo, p_descricao, p_preco_original, p_preco_desconto,
    p_percentual_desconto, p_foto_url, COALESCE(p_fotos_urls, '{}'::text[]), p_link_afiliado, p_loja,
    p_categoria, p_avaliacao, p_frete_gratis, p_expires_at
  )
  ON CONFLICT (loja, external_id) WHERE external_id IS NOT NULL DO NOTHING
  RETURNING id INTO novo_id;

  RETURN novo_id;
END;
$$;


-- ------------------------------------------------------------
-- 5) Agendamento pg_cron (roda todo minuto; a função decide se publica)
-- ------------------------------------------------------------
-- Requer a extensão pg_cron habilitada no projeto
-- (Dashboard → Database → Extensions → pg_cron).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove agendamento anterior (se existir) antes de recriar.
DO $$
BEGIN
  PERFORM cron.unschedule('drip-feed-promos');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'drip-feed-promos',
  '* * * * *',
  $$ SELECT public.publicar_proxima_promo(); $$
);

-- ------------------------------------------------------------
-- Ajustes rápidos (exemplos)
-- ------------------------------------------------------------
--   -- Mudar a janela de intervalo para 3–10 minutos:
--   UPDATE public.feed_drip_control
--      SET gap_min_minutos = 3, gap_max_minutos = 10 WHERE id = 1;
--
--   -- Pausar o gotejamento:
--   UPDATE public.feed_drip_control SET ativo = false WHERE id = 1;
--
--   -- Publicar de imediato (zera o relógio):
--   UPDATE public.feed_drip_control SET proxima_publicacao_em = now() WHERE id = 1;
--
--   -- Publicar 2 por disparo:
--   UPDATE public.feed_drip_control SET lote_por_ciclo = 2 WHERE id = 1;
--
--   -- Mudar o descarte de "encalhadas" para 12h:
--   UPDATE public.feed_drip_control SET descartar_apos_horas = 12 WHERE id = 1;
--
--   -- Ver quantas promos aguardam na fila:
--   SELECT count(*) FROM public.promocoes_fila;
--
--   -- Testar manualmente (fora do cron):
--   SELECT public.publicar_proxima_promo();
