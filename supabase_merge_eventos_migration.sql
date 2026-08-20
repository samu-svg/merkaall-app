-- ============================================================
-- Merge de eventos visitante → conta logada — Merkaall
-- Execute no SQL Editor após supabase_recomendacao_migration.sql
-- ============================================================

-- Se recomendar_promocoes já existir com outro tipo de retorno, o CREATE OR REPLACE falha.
-- Este bloco é idempotente: pode rodar mesmo após supabase_fotos_rpc_migration.sql.
DROP FUNCTION IF EXISTS public.recomendar_promocoes(text, integer);
DROP FUNCTION IF EXISTS public.recomendar_promocoes(text, int);

-- Reescreve user_events do device_id para user_id (UUID auth) e recalcula perfil.
CREATE OR REPLACE FUNCTION public.merge_user_events(
  p_device_id text,
  p_user_id   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_device_id IS NULL OR p_user_id IS NULL OR p_device_id = p_user_id THEN
    RETURN;
  END IF;

  UPDATE user_events
  SET user_id = p_user_id
  WHERE user_id = p_device_id;

  DELETE FROM user_profiles WHERE user_id = p_device_id;

  PERFORM recalcular_perfil(p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_user_events(text, text) TO anon, authenticated;
