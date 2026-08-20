import AsyncStorage from '@react-native-async-storage/async-storage';

/** Migra dados locais do nome antigo (PromoçãoPro) para Merkaall. */
export async function migrateStorageKey(oldKey: string, newKey: string): Promise<void> {
  if (oldKey === newKey) return;
  const atual = await AsyncStorage.getItem(newKey);
  if (atual !== null) return;
  const legado = await AsyncStorage.getItem(oldKey);
  if (legado === null) return;
  await AsyncStorage.setItem(newKey, legado);
  await AsyncStorage.removeItem(oldKey);
}
