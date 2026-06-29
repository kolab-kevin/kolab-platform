/** Event tracking and platform analytics — implemented in Phase 3. */
export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
};
