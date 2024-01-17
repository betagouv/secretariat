import * as Sentry from '@sentry/node';
import { CaptureConsole as CaptureConsoleIntegration } from "@sentry/integrations";
import config from '@config';

export function initCaptureConsole() {
  const logLevel = ['error'];
  console.log(
    `Initializing Sentry for log level "${logLevel}" and config: ${config.sentryDNS}`
  );
  Sentry.init({
    dsn: config.sentryDNS as string,
    // https://docs.sentry.io/platforms/javascript/configuration/integrations/plugin/#captureconsole
    integrations: [new CaptureConsoleIntegration({ levels: logLevel })],
  });
}

export function initCaptureConsoleWithHandler(app) {
  if (config.sentryDNS) {
    initCaptureConsole();

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());

    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());
  } else {
    console.log(
      'Sentry was not initialized as SENTRY_DNS env variable is missing'
    );
  }
}
