-- Push notifications: tokens Expo + histórico server-side
-- Execute no SQL Editor do Supabase antes de usar push real.

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  device_id    TEXT PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expo_token   TEXT NOT NULL UNIQUE,
  platform     TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_push_tokens_user_id_idx
  ON public.device_push_tokens (user_id);

ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Anon precisa registrar token por device_id (sem JWT com device_id).
-- INSERT permissivo; UPDATE permite vincular user_id ao logar.
CREATE POLICY "Registra push token"
  ON public.device_push_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Atualiza push token"
  ON public.device_push_tokens FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Le proprio push token"
  ON public.device_push_tokens FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    TEXT,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('nova_promo', 'queda_preco', 'alerta')),
  promocao_id  UUID REFERENCES public.promocoes(id) ON DELETE SET NULL,
  titulo       TEXT NOT NULL,
  corpo        TEXT NOT NULL,
  lida         BOOLEAN NOT NULL DEFAULT false,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notificacoes_owner_criado_em_idx
  ON public.notificacoes (COALESCE(user_id::text, device_id), criado_em DESC);

CREATE INDEX IF NOT EXISTS notificacoes_promocao_tipo_idx
  ON public.notificacoes (promocao_id, tipo, device_id, user_id);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Leitura: usuário logado vê as suas; anon sem user_id — filtro por device_id
-- no app exigiria claim customizado; Fase 2 pode refinar. Por ora, leitura logada.
CREATE POLICY "Usuario le proprias notificacoes"
  ON public.notificacoes FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Usuario atualiza proprias notificacoes"
  ON public.notificacoes FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- INSERT feito pela Edge Function (service role). App não insere diretamente.

-- ============================================================
-- Agendamento opcional: pg_cron + pg_net chamando send-push
-- Requer extensões pg_cron e pg_net habilitadas no projeto.
-- Substitua YOUR_PROJECT_REF e YOUR_ANON_OR_SERVICE_INVOKE_KEY.
-- ============================================================
--
-- SELECT cron.schedule(
--   'send-push-recent-promos',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_ANON_OR_SERVICE_INVOKE_KEY'
--     ),
--     body := '{"scan_recent": true}'::jsonb
--   );
--   $$
-- );
--
-- Trigger em promocoes (dispara ao inserir/atualizar):
--
-- CREATE OR REPLACE FUNCTION public.notify_promo_push()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- BEGIN
--   PERFORM net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_ANON_OR_SERVICE_INVOKE_KEY'
--     ),
--     body := jsonb_build_object(
--       'promocao_id', NEW.id,
--       'preco_anterior', CASE WHEN TG_OP = 'UPDATE' THEN OLD.preco_desconto ELSE NULL END,
--       'is_update', TG_OP = 'UPDATE'
--     )
--   );
--   RETURN NEW;
-- END;
-- $$;
--
-- DROP TRIGGER IF EXISTS trg_notify_promo_push ON public.promocoes;
-- CREATE TRIGGER trg_notify_promo_push
--   AFTER INSERT OR UPDATE OF preco_desconto, percentual_desconto, aprovada
--   ON public.promocoes
--   FOR EACH ROW
--   WHEN (NEW.aprovada = true)
--   EXECUTE FUNCTION public.notify_promo_push();
