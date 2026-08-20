import { getDeviceId } from '@/lib/deviceId';
import { useAuthStore } from '@/store/useAuthStore';

export async function getEffectiveUserId(): Promise<string> {
  const session = useAuthStore.getState().session;
  if (session?.user?.id) {
    return session.user.id;
  }
  return getDeviceId();
}
