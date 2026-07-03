import { sanitizeFileName } from '@kolab/storage';
import type { CreatorContractStatus } from '@kolab/types';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_STATUS_TRANSITIONS: Record<CreatorContractStatus, CreatorContractStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['VIEWED', 'SIGNED', 'EXPIRED', 'CANCELLED'],
  VIEWED: ['SIGNED', 'EXPIRED', 'CANCELLED'],
  SIGNED: ['TERMINATED'],
  EXPIRED: ['DRAFT'],
  CANCELLED: ['DRAFT'],
  TERMINATED: ['DRAFT'],
};

export function toMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

export function assertAllowedContractStatusTransition(
  currentStatus: CreatorContractStatus,
  nextStatus: CreatorContractStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new BadRequestException('Contract status is already set to the requested value');
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition contract status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export function assertContractIsEditable(
  status: CreatorContractStatus,
  input: {
    title?: string;
    validFrom?: string | null;
    validUntil?: string | null;
    metadata?: Record<string, unknown>;
  },
): void {
  if (status !== 'SIGNED') {
    return;
  }

  if (
    input.title !== undefined ||
    input.validFrom !== undefined ||
    input.validUntil !== undefined
  ) {
    throw new BadRequestException(
      'Signed contracts cannot modify title or validity dates; metadata updates only',
    );
  }

  if (input.metadata === undefined) {
    throw new BadRequestException('Signed contracts only allow metadata updates');
  }
}

export function assertContractAllowsNewVersion(status: CreatorContractStatus): void {
  if (status === 'SIGNED' || status === 'TERMINATED') {
    throw new BadRequestException('Signed or terminated contracts cannot accept new versions');
  }
}

export function parseContractVersionStorageKey(
  creatorId: string,
  contractId: string,
  storageKey: string,
): { versionId: string; fileName: string } {
  const segments = storageKey.split('/');

  if (segments.length !== 9) {
    throw new BadRequestException('storageKey does not match the expected creator contract layout');
  }

  const [, , , keyCreatorId, resourceKind, keyContractId, , versionId, fileName] = segments;

  if (keyCreatorId !== creatorId || resourceKind !== 'contracts' || keyContractId !== contractId) {
    throw new BadRequestException('storageKey does not match the target creator contract');
  }

  return { versionId, fileName };
}

export function assertStorageKeyFileNameMatches(
  storageKeyFileName: string,
  requestedFileName: string,
): void {
  const sanitized = sanitizeFileName(requestedFileName);

  if (storageKeyFileName !== sanitized) {
    throw new BadRequestException('storageKey file segment does not match fileName');
  }
}

export function findLatestUploadedVersion<
  T extends { id: string; versionNumber: number; storageKey: string | null },
>(versions: T[], versionId?: string): T | undefined {
  if (versionId) {
    return versions.find((version) => version.id === versionId);
  }

  return [...versions]
    .reverse()
    .find((version) => typeof version.storageKey === 'string' && version.storageKey.length > 0);
}
