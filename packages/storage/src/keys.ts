import { STORAGE_KEY_PREFIX, type StorageResourceKind } from './constants';
import { SAFE_FILE_NAME_PATTERN, sanitizeFileName } from './filename';

const STORAGE_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;

export type CreateStorageKeyInput = {
  organizationId: string;
  creatorId: string;
  resourceKind: StorageResourceKind;
  resourceId: string;
  versionId: string;
  fileName: string;
};

export class StorageKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageKeyError';
  }
}

function assertStorageSegment(value: string, label: string): void {
  if (!STORAGE_SEGMENT_PATTERN.test(value)) {
    throw new StorageKeyError(`${label} contains invalid characters`);
  }
}

export function createStorageKey(input: CreateStorageKeyInput): string {
  assertStorageSegment(input.organizationId, 'organizationId');
  assertStorageSegment(input.creatorId, 'creatorId');
  assertStorageSegment(input.resourceId, 'resourceId');
  assertStorageSegment(input.versionId, 'versionId');

  const safeFileName = sanitizeFileName(input.fileName);

  return [
    STORAGE_KEY_PREFIX,
    input.organizationId,
    'creators',
    input.creatorId,
    input.resourceKind,
    input.resourceId,
    'versions',
    input.versionId,
    safeFileName,
  ].join('/');
}

export function validateStorageKey(organizationId: string, storageKey: string): void {
  assertStorageSegment(organizationId, 'organizationId');

  if (!storageKey || storageKey.includes('\\')) {
    throw new StorageKeyError('storageKey is invalid');
  }

  if (storageKey.includes('..')) {
    throw new StorageKeyError('storageKey must not contain path traversal segments');
  }

  const expectedPrefix = `${STORAGE_KEY_PREFIX}/${organizationId}/`;
  if (!storageKey.startsWith(expectedPrefix)) {
    throw new StorageKeyError('storageKey is not scoped to the active organization');
  }

  const segments = storageKey.split('/');
  if (segments.length !== 9) {
    throw new StorageKeyError('storageKey does not match the expected creator object layout');
  }

  const [
    prefix,
    keyOrganizationId,
    creatorsSegment,
    creatorId,
    resourceKind,
    resourceId,
    versionsSegment,
    versionId,
    fileName,
  ] = segments;

  if (
    prefix !== STORAGE_KEY_PREFIX ||
    keyOrganizationId !== organizationId ||
    creatorsSegment !== 'creators' ||
    versionsSegment !== 'versions' ||
    (resourceKind !== 'documents' && resourceKind !== 'contracts')
  ) {
    throw new StorageKeyError('storageKey does not match the expected creator object layout');
  }

  assertStorageSegment(creatorId, 'creatorId');
  assertStorageSegment(resourceId, 'resourceId');
  assertStorageSegment(versionId, 'versionId');

  if (!SAFE_FILE_NAME_PATTERN.test(fileName)) {
    throw new StorageKeyError('storageKey file segment is invalid');
  }
}
