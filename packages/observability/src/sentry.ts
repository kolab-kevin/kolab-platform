/**
 * Sentry integration placeholder.
 * Set SENTRY_DSN to enable — wire @sentry/node in a future release.
 */
export type SentryOptions = {
  dsn?: string;
  environment?: string;
  release?: string;
};

export function initSentry(options: SentryOptions): void {
  if (!options.dsn) {
    return;
  }

  // Placeholder: replace with @sentry/node init when DSN is configured in production.
  console.warn(
    '[observability] SENTRY_DSN is set but Sentry SDK is not yet installed. Skipping init.',
  );
}

export function captureException(_error: unknown, _context?: Record<string, unknown>): void {
  // Placeholder for Sentry.captureException(error, { extra: context })
}
