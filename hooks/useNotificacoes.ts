import { useCallback, useEffect, useState } from 'react';

import {
  buscarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
} from '@/lib/notificacoes';
import type { Notificacao } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';

export function useNotificacoes(enabled = true) {
  const userId = useAuthStore((s) => s.session?.user?.id ?? null);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!enabled) return;

    setCarregando(true);
    setErro(null);

    const { data, error } = await buscarNotificacoes(userId);
    setLista(data);
    if (error) setErro(error);

    setCarregando(false);
  }, [enabled, userId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const marcarLida = useCallback(
    async (id: string) => {
      setLista((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
      await marcarNotificacaoLida(id);
    },
    [],
  );

  const marcarTodasLidas = useCallback(async () => {
    setLista((prev) => prev.map((n) => ({ ...n, lida: true })));
    await marcarTodasNotificacoesLidas(userId);
  }, [userId]);

  const naoLidas = lista.filter((n) => !n.lida).length;

  return {
    lista,
    carregando,
    erro,
    naoLidas,
    recarregar,
    marcarLida,
    marcarTodasLidas,
  };
}
