import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  environment: process.env.NODE_ENV,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry] Event:", event);
    }
    return event;
  },
});