/**
 * OpenTelemetry foundation placeholder.
 * Set OTEL_EXPORTER_OTLP_ENDPOINT to enable — wire @opentelemetry/sdk-node later.
 */
export type OtelOptions = {
  serviceName?: string;
  endpoint?: string;
};

export function initTelemetry(options: OtelOptions): void {
  if (!options.endpoint) {
    return;
  }

  // Placeholder: replace with OpenTelemetry NodeSDK bootstrap.
  console.warn(
    '[observability] OTEL_EXPORTER_OTLP_ENDPOINT is set but OTel SDK is not yet installed. Skipping init.',
  );
}

export function getTelemetryStatus(): { enabled: boolean; serviceName: string } {
  return {
    enabled: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'kolab-api',
  };
}
