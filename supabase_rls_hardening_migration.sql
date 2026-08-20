-- Endurece RLS de dados pessoais / device-bound e restringe funções internas.
-- Anon só acessa linhas cujo device_id coincide com o header x-device-id.
-- Aplique no SQL Editor do projeto Supabase compartilhado com o site.

CREATE OR REPLACE FUNCTION public.request_device_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    BTRIM(COALESCE(current_setting('request.headers', true)::json->>'x-device-id', '')),
    ''
  );
$$;

REVOKE ALL ON FUNCTION public.request_device_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_device_id() TO anon, authenticated;

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  );

CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  );

CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  );

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  );

DROP POLICY IF EXISTS "alertas_disparados_insert_own" ON public.alertas_disparados;
DROP POLICY IF EXISTS "alertas_disparados_select_own" ON public.alertas_disparados;
DROP POLICY IF EXISTS "alertas_disparados_update_own" ON public.alertas_disparados;
DROP POLICY IF EXISTS "alertas_disparados_delete_own" ON public.alertas_disparados;

CREATE POLICY "alertas_disparados_select_own"
  ON public.alertas_disparados FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  );

CREATE POLICY "alertas_disparados_insert_own"
  ON public.alertas_disparados FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND device_id IS NOT NULL
      AND device_id = (SELECT public.request_device_id())
    )
  );

ALTER TABLE IF EXISTS public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_events_insert_own_device" ON public.user_events;

CREATE POLICY "user_events_insert_own_device"
  ON public.user_events FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
    AND user_id = (SELECT public.request_device_id())
  );

ALTER TABLE IF EXISTS public.device_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registra push token" ON public.device_push_tokens;
DROP POLICY IF EXISTS "Atualiza push token" ON public.device_push_tokens;
DROP POLICY IF EXISTS "Le proprio push token" ON public.device_push_tokens;
DROP POLICY IF EXISTS "device_push_tokens_select_own" ON public.device_push_tokens;
DROP POLICY IF EXISTS "device_push_tokens_insert_own" ON public.device_push_tokens;
DROP POLICY IF EXISTS "device_push_tokens_update_own" ON public.device_push_tokens;
DROP POLICY IF EXISTS "device_push_tokens_delete_own" ON public.device_push_tokens;

CREATE POLICY "device_push_tokens_select_own"
  ON public.device_push_tokens FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (device_id = (SELECT public.request_device_id()))
  );

CREATE POLICY "device_push_tokens_insert_own"
  ON public.device_push_tokens FOR INSERT
  WITH CHECK (
    device_id = (SELECT public.request_device_id())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "device_push_tokens_update_own"
  ON public.device_push_tokens FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (device_id = (SELECT public.request_device_id()))
  )
  WITH CHECK (
    device_id = (SELECT public.request_device_id())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('recomendar_promocoes', 'recalcular_perfil', 'trigger_recalcular_perfil')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', r.sig);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('recalcular_perfil', 'trigger_recalcular_perfil')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;
