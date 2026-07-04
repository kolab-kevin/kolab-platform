import type { LivePlatform } from '@kolab/types';
import { BadRequestException } from '@nestjs/common';

export const MAX_LIVE_EVENT_PAYLOAD_BYTES = 65_536;

const FORBIDDEN_PAYLOAD_KEY_PATTERN =
  /(audio|video|rawaudio|rawvideo|base64|blob|dataurl|mediaurl|recording)/i;

const DATA_URL_PATTERN = /^data:(audio|video)\//i;

const BASE64_BLOB_PATTERN = /^[A-Za-z0-9+/=\r\n]{4096,}$/;

export function assertSafeLiveEventPayload(
  payload: Record<string, unknown>,
  path = 'payload',
): void {
  const serialized = JSON.stringify(payload);

  if (serialized.length > MAX_LIVE_EVENT_PAYLOAD_BYTES) {
    throw new BadRequestException(
      `${path} exceeds maximum size of ${MAX_LIVE_EVENT_PAYLOAD_BYTES} bytes`,
    );
  }

  visitPayloadValue(payload, path);
}

export function assertLiveEventPlatform(
  sessionPlatform: LivePlatform,
  eventPlatform: LivePlatform,
  allowPlatformMismatch: boolean | undefined,
): void {
  if (sessionPlatform === eventPlatform || allowPlatformMismatch) {
    return;
  }

  throw new BadRequestException(
    `Event platform ${eventPlatform} does not match session platform ${sessionPlatform}`,
  );
}

export function assertLiveEventCreatorProfile(
  sessionCreatorProfileId: string,
  eventCreatorProfileId: string,
): void {
  if (sessionCreatorProfileId === eventCreatorProfileId) {
    return;
  }

  throw new BadRequestException('Event creatorProfileId must match the live session creator');
}

function visitPayloadValue(value: unknown, path: string): void {
  if (typeof value === 'string') {
    assertSafePayloadString(value, path);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitPayloadValue(item, `${path}[${index}]`));
    return;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.replace(/[_-]/g, '').toLowerCase();

      if (FORBIDDEN_PAYLOAD_KEY_PATTERN.test(normalizedKey)) {
        throw new BadRequestException(`${path}.${key} is not allowed in live event payloads`);
      }

      visitPayloadValue(nestedValue, `${path}.${key}`);
    }
  }
}

function assertSafePayloadString(value: string, path: string): void {
  if (DATA_URL_PATTERN.test(value)) {
    throw new BadRequestException(`${path} must not contain raw audio or video data URLs`);
  }

  if (BASE64_BLOB_PATTERN.test(value)) {
    throw new BadRequestException(`${path} must not contain base64-encoded media blobs`);
  }
}
