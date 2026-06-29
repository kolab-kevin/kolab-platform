import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function generateRequestId(): string {
  return randomUUID();
}

export function getRequestIdFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const value = headers[REQUEST_ID_HEADER];
  if (Array.isArray(value)) return value[0];
  return value;
}

export type RequestContext = {
  requestId: string;
};
