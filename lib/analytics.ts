type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

let posthogClient: { capture: (event: string, props?: AnalyticsProps) => void } | null = null;
let initAttempted = false;

function tryInitPostHog(): void {
  if (initAttempted) return;
  initAttempted = true;

  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;

  try {
    const PostHog = require('posthog-react-native').default as {
      init: (
        apiKey: string,
        options?: Record<string, unknown>,
      ) => { capture: (event: string, props?: AnalyticsProps) => void };
    };
    posthogClient = PostHog.init(key, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    });
  } catch {
    posthogClient = null;
  }
}

export function identify(userId: string): void {
  tryInitPostHog();
  if (!posthogClient) return;

  try {
    const client = posthogClient as unknown as { identify?: (id: string) => void };
    client.identify?.(userId);
  } catch {
    /* optional SDK */
  }
}

export function track(event: string, props?: AnalyticsProps): void {
  tryInitPostHog();

  if (posthogClient) {
    posthogClient.capture(event, props);
    return;
  }

  if (__DEV__) {
    console.debug('[analytics]', event, props ?? {});
  }
}
