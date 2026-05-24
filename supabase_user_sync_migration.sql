-- Sincronização de salvos e alertas por usuário

CREATE TABLE IF NOT EXISTS public.promocoes_salvas (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promocao_id UUID NOT NULL REFERENCES public.promocoes(id) ON DELETE CASCADE,
  salvo_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, promocao_id)
);

CREATE INDEX IF NOT EXISTS promocoes_salvas_user_salvo_em_idx
  ON public.promocoes_salvas (user_id, salvo_em DESC);

ALTER TABLE public.promocoes_salvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve proprias promocoes salvas"
  ON public.promocoes_salvas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario insere proprias promocoes salvas"
  ON public.promocoes_salvas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario remove proprias promocoes salvas"
  ON public.promocoes_salvas FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.alertas_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  categoria TEXT,
  preco_maximo NUMERIC,
  desconto_minimo NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alertas_preco_user_criado_em_idx
  ON public.alertas_preco (user_id, criado_em DESC);

ALTER TABLE public.alertas_preco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve proprios alertas"
  ON public.alertas_preco FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario insere proprios alertas"
  ON public.alertas_preco FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario atualiza proprios alertas"
  ON public.alertas_preco FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario remove proprios alertas"
  ON public.alertas_preco FOR DELETE
  USING (auth.uid() = user_id);
