let monitoringInitialized = false;

export function initMonitoring(): void {
  if (monitoringInitialized) return;
  monitoringInitialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    const Sentry = require('@sentry/react-native') as {
      init: (options: Record<string, unknown>) => void;
    };
    Sentry.init({
      dsn,
      enableInExpoDevelopment: false,
      debug: __DEV__,
    });
  } catch {
    /* optional SDK */
  }
}
