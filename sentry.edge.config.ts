import * as Sentry from "@sentry/nextjs";

const moduleConfig = {
  debug: process.env.NODE_ENV === "development",
};

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  ...moduleConfig,
});