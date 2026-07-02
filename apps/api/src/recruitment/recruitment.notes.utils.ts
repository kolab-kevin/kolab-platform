import { toRecord } from './recruitment.utils';

export const NOTE_RECORDS_METADATA_KEY = 'noteRecords';

export type NoteRecordMetadata = {
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  editHistory?: Array<{
    editedAt: string;
    editedBy: string;
    previousContactType?: string;
    previousNote?: string;
  }>;
};

export function getNoteRecordsStore(leadMetadata: unknown): Record<string, NoteRecordMetadata> {
  const store = toRecord(leadMetadata)[NOTE_RECORDS_METADATA_KEY];

  if (typeof store === 'object' && store !== null && !Array.isArray(store)) {
    return store as Record<string, NoteRecordMetadata>;
  }

  return {};
}

export function getNoteRecordMetadata(
  leadMetadata: unknown,
  noteId: string,
): NoteRecordMetadata | undefined {
  return getNoteRecordsStore(leadMetadata)[noteId];
}

export function isNoteSoftDeleted(leadMetadata: unknown, noteId: string): boolean {
  return getNoteRecordMetadata(leadMetadata, noteId)?.deleted === true;
}

export function mergeNoteRecordMetadata(
  leadMetadata: unknown,
  noteId: string,
  patch: NoteRecordMetadata,
): Record<string, unknown> {
  const metadata = toRecord(leadMetadata);
  const noteRecords = getNoteRecordsStore(leadMetadata);

  return {
    ...metadata,
    [NOTE_RECORDS_METADATA_KEY]: {
      ...noteRecords,
      [noteId]: {
        ...noteRecords[noteId],
        ...patch,
      },
    },
  };
}

export function buildNoteSoftDeleteMetadata(
  leadMetadata: unknown,
  noteId: string,
  deletedByUserId: string,
): Record<string, unknown> {
  return mergeNoteRecordMetadata(leadMetadata, noteId, {
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: deletedByUserId,
  });
}

export function appendNoteEditHistory(
  leadMetadata: unknown,
  noteId: string,
  entry: NonNullable<NoteRecordMetadata['editHistory']>[number],
): Record<string, unknown> {
  const existing = getNoteRecordMetadata(leadMetadata, noteId);
  const editHistory = [...(existing?.editHistory ?? []), entry];

  return mergeNoteRecordMetadata(leadMetadata, noteId, { editHistory });
}

export function toNoteResponseMetadata(
  leadMetadata: unknown,
  noteId: string,
): Record<string, unknown> {
  const record = getNoteRecordMetadata(leadMetadata, noteId);

  if (!record) {
    return {};
  }

  return {
    ...(record.editHistory ? { editHistory: record.editHistory } : {}),
    ...(record.deleted ? { deleted: record.deleted } : {}),
    ...(record.deletedAt ? { deletedAt: record.deletedAt } : {}),
    ...(record.deletedBy ? { deletedBy: record.deletedBy } : {}),
  };
}
