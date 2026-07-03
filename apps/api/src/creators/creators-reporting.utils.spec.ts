import {
  buildMissingDocumentCursor,
  getContractExpirationStatus,
  getDocumentExpirationStatus,
  paginateCompositeCursor,
  parseMissingDocumentCursor,
} from './creators-reporting.utils';

describe('creators-reporting.utils', () => {
  const now = new Date('2026-07-02T12:00:00.000Z');

  it('classifies document expiration status', () => {
    expect(getDocumentExpirationStatus(new Date('2026-08-01T00:00:00.000Z'), now)).toBe('EXPIRING');
    expect(getDocumentExpirationStatus(new Date('2026-06-01T00:00:00.000Z'), now)).toBe('EXPIRED');
  });

  it('classifies contract expiration status', () => {
    expect(getContractExpirationStatus(new Date('2026-08-01T00:00:00.000Z'), now)).toBe('EXPIRING');
    expect(getContractExpirationStatus(new Date('2026-06-01T00:00:00.000Z'), now)).toBe('EXPIRED');
  });

  it('builds and parses missing document cursors', () => {
    const cursor = buildMissingDocumentCursor('creator-1', 'GOVERNMENT_ID');

    expect(parseMissingDocumentCursor(cursor)).toEqual({
      creatorId: 'creator-1',
      documentType: 'GOVERNMENT_ID',
    });
  });

  it('paginates composite cursor lists', () => {
    const items = [
      { id: 'creator-1:GOVERNMENT_ID' },
      { id: 'creator-2:GOVERNMENT_ID' },
      { id: 'creator-3:GOVERNMENT_ID' },
    ];

    const firstPage = paginateCompositeCursor(items, 2, undefined, (item) => item.id);
    expect(firstPage.page).toHaveLength(2);
    expect(firstPage.nextCursor).toBe('creator-2:GOVERNMENT_ID');

    const secondPage = paginateCompositeCursor(
      items,
      2,
      firstPage.nextCursor ?? undefined,
      (item) => item.id,
    );
    expect(secondPage.page).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
  });
});
