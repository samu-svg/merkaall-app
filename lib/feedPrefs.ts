import { getSupabaseClient } from '@/lib/supabase';
import { getEffectiveUserId } from '@/lib/userId';

const PESO_FAVORITE = 8;

export async function seedCategoryPreferences(categorias: string[]): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || categorias.length === 0) return;

    const userId = await getEffectiveUserId();
    const rows = categorias.map((categoria) => ({
      user_id: userId,
      promocao_id: `pref-${categoria}-${Date.now()}`,
      event_type: 'favorite',
      peso: PESO_FAVORITE,
      categoria,
      preco: null,
    }));

    const { error } = await supabase.from('user_events').insert(rows);
    if (error) console.warn('[seedCategoryPreferences]', error.message);
  } catch (err) {
    console.warn('[seedCategoryPreferences]', err);
  }
}
