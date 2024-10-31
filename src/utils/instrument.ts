import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.postgresIntegration(), Sentry.koaIntegration()],
  // tracePropagationTargets: ["localhost:3000"],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  maxBreadcrumbs: 100, // Aumenta el número máximo de breadcrumbs
  attachStacktrace: true, // Asegúrate de que se adjunten las trazas de pila
});
