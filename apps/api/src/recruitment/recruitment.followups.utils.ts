import { toRecord } from './recruitment.utils';

export const FOLLOW_UP_HISTORY_METADATA_KEY = 'followUpHistory';

export type FollowUpHistoryEntry = {
  updatedAt: string;
  updatedBy: string;
  previousFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  note?: string;
};

export function getFollowUpHistory(leadMetadata: unknown): FollowUpHistoryEntry[] {
  const history = toRecord(leadMetadata)[FOLLOW_UP_HISTORY_METADATA_KEY];

  if (!Array.isArray(history)) {
    return [];
  }

  return history.filter(
    (entry): entry is FollowUpHistoryEntry =>
      typeof entry === 'object' && entry !== null && 'updatedAt' in entry,
  );
}

export function appendFollowUpHistory(
  leadMetadata: unknown,
  entry: FollowUpHistoryEntry,
): Record<string, unknown> {
  const metadata = toRecord(leadMetadata);

  return {
    ...metadata,
    [FOLLOW_UP_HISTORY_METADATA_KEY]: [...getFollowUpHistory(leadMetadata), entry],
  };
}
