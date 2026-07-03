import type {
  CreatorContract as PrismaCreatorContract,
  CreatorContractVersion as PrismaCreatorContractVersion,
} from '@kolab/database';
import type { CreatorContract, CreatorContractDetail, CreatorContractVersion } from '@kolab/types';

import { toMetadataRecord } from './creators-contracts.utils';

export function toCreatorContractVersion(
  version: PrismaCreatorContractVersion,
): CreatorContractVersion {
  return {
    id: version.id,
    organizationId: version.organizationId,
    contractId: version.contractId,
    versionNumber: version.versionNumber,
    storageKey: version.storageKey,
    fileName: version.fileName,
    mimeType: version.mimeType,
    sizeBytes: version.sizeBytes,
    checksum: version.checksum,
    signedAt: version.signedAt?.toISOString() ?? null,
    signedByUserId: version.signedByUserId,
    externalEnvelopeId: version.externalEnvelopeId,
    metadata: toMetadataRecord(version.metadata),
    createdAt: version.createdAt.toISOString(),
  };
}

export function toCreatorContract(contract: PrismaCreatorContract): CreatorContract {
  return {
    id: contract.id,
    organizationId: contract.organizationId,
    creatorProfileId: contract.creatorProfileId,
    sourceLeadId: contract.sourceLeadId,
    contractType: contract.contractType as CreatorContract['contractType'],
    status: contract.status as CreatorContract['status'],
    title: contract.title,
    parentContractId: contract.parentContractId,
    validFrom: contract.validFrom?.toISOString() ?? null,
    validUntil: contract.validUntil?.toISOString() ?? null,
    signedAt: contract.signedAt?.toISOString() ?? null,
    signedByUserId: contract.signedByUserId,
    externalEnvelopeId: contract.externalEnvelopeId,
    metadata: toMetadataRecord(contract.metadata),
    deletedAt: contract.deletedAt?.toISOString() ?? null,
    createdAt: contract.createdAt.toISOString(),
    updatedAt: contract.updatedAt.toISOString(),
  };
}

export function toCreatorContractDetail(
  contract: PrismaCreatorContract & { versions: PrismaCreatorContractVersion[] },
): CreatorContractDetail {
  return {
    ...toCreatorContract(contract),
    versions: contract.versions
      .slice()
      .sort((left, right) => left.versionNumber - right.versionNumber)
      .map(toCreatorContractVersion),
  };
}
