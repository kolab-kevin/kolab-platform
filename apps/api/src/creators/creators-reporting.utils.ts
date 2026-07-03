import type { CreatorDocumentType } from '@kolab/types';

export const REQUIRED_CREATOR_DOCUMENT_TYPES: CreatorDocumentType[] = ['GOVERNMENT_ID'];

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getDocumentExpirationStatus(
  expiresAt: Date,
  now: Date = new Date(),
): 'EXPIRING' | 'EXPIRED' {
  return expiresAt.getTime() < now.getTime() ? 'EXPIRED' : 'EXPIRING';
}

export function getContractExpirationStatus(
  validUntil: Date,
  now: Date = new Date(),
): 'EXPIRING' | 'EXPIRED' {
  return validUntil.getTime() < now.getTime() ? 'EXPIRED' : 'EXPIRING';
}

export function buildMissingDocumentCursor(creatorId: string, documentType: string): string {
  return `${creatorId}:${documentType}`;
}

export function parseMissingDocumentCursor(cursor: string): {
  creatorId: string;
  documentType: string;
} | null {
  const separatorIndex = cursor.indexOf(':');

  if (separatorIndex <= 0 || separatorIndex === cursor.length - 1) {
    return null;
  }

  return {
    creatorId: cursor.slice(0, separatorIndex),
    documentType: cursor.slice(separatorIndex + 1),
  };
}

export function paginateCompositeCursor<T>(
  items: T[],
  limit: number,
  cursor: string | undefined,
  getCursorValue: (item: T) => string,
): { page: T[]; nextCursor: string | null } {
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = items.findIndex((item) => getCursorValue(item) === cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const page = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;

  return {
    page,
    nextCursor: hasMore ? getCursorValue(page.at(-1) as T) : null,
  };
}
