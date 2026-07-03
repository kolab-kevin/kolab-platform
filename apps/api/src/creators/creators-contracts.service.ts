import type { AccessTokenPayload } from '@kolab/auth';
import type {
  CreatorContract as PrismaCreatorContract,
  CreatorContractVersion as PrismaCreatorContractVersion,
} from '@kolab/database';
import { CreatorContractStatus, MembershipStatus, Prisma, prisma } from '@kolab/database';
import {
  getPresignedDownloadUrl,
  loadStorageConfig,
  StorageKeyError,
  UploadValidationError,
  validateStorageKey,
  validateUploadMetadata,
} from '@kolab/storage';
import type {
  CreateCreatorContractInput,
  CreateCreatorContractVersionInput,
  CreatorContract,
  CreatorContractDetail,
  CreatorContractStatus as CreatorContractStatusType,
  DownloadCreatorContractInput,
  DownloadCreatorContractResponse,
  ListCreatorContractsResponse,
  SignCreatorContractInput,
  UpdateCreatorContractInput,
  UpdateCreatorContractStatusInput,
} from '@kolab/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '../audit/audit-actions';
import { toCreatorContract, toCreatorContractDetail } from './creators-contracts.mapper';
import {
  assertAllowedContractStatusTransition,
  assertContractAllowsNewVersion,
  assertContractIsEditable,
  assertStorageKeyFileNameMatches,
  findLatestUploadedVersion,
  parseContractVersionStorageKey,
  toMetadataRecord,
} from './creators-contracts.utils';

const contractInclude = {
  versions: {
    orderBy: { versionNumber: 'asc' as const },
  },
};

type CreatorContractWithVersions = PrismaCreatorContract & {
  versions: PrismaCreatorContractVersion[];
};

@Injectable()
export class CreatorsContractsService {
  constructor(private readonly auditService: AuditService) {}

  async listContracts(
    user: AccessTokenPayload,
    creatorId: string,
  ): Promise<ListCreatorContractsResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);

    const contracts = await prisma.creatorContract.findMany({
      where: {
        organizationId,
        creatorProfileId: creatorId,
        deletedAt: null,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      items: contracts.map(toCreatorContract),
    };
  }

  async getContract(
    user: AccessTokenPayload,
    creatorId: string,
    contractId: string,
  ): Promise<CreatorContractDetail> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);

    const contract = await this.loadCreatorContract(organizationId, creatorId, contractId, {
      include: contractInclude,
    });

    return toCreatorContractDetail(contract);
  }

  async createContract(
    user: AccessTokenPayload,
    creatorId: string,
    input: CreateCreatorContractInput,
  ): Promise<CreatorContract> {
    const organizationId = await this.requireActiveOrganization(user);
    const creator = await this.requireCreatorProfile(organizationId, creatorId);

    if (input.creatorProfileId && input.creatorProfileId !== creatorId) {
      throw new BadRequestException('creatorProfileId must match the creator in the URL path');
    }

    if (input.parentContractId) {
      await this.loadCreatorContract(organizationId, creatorId, input.parentContractId);
    }

    const contract = await prisma.creatorContract.create({
      data: {
        organizationId,
        creatorProfileId: creatorId,
        sourceLeadId: input.sourceLeadId ?? creator.sourceLeadId,
        contractType: input.contractType,
        status: CreatorContractStatus.DRAFT,
        title: input.title,
        parentContractId: input.parentContractId ?? null,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CONTRACT_CREATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      targetId: contract.id,
      metadata: {
        creatorId,
        contractType: contract.contractType,
        status: contract.status,
      },
    });

    return toCreatorContract(contract);
  }

  async updateContract(
    user: AccessTokenPayload,
    creatorId: string,
    contractId: string,
    input: UpdateCreatorContractInput,
  ): Promise<CreatorContract> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    const contract = await this.loadCreatorContract(organizationId, creatorId, contractId);

    assertContractIsEditable(contract.status as CreatorContractStatusType, input);

    const updated = await prisma.creatorContract.update({
      where: { id: contractId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.validFrom !== undefined
          ? { validFrom: input.validFrom ? new Date(input.validFrom) : null }
          : {}),
        ...(input.validUntil !== undefined
          ? { validUntil: input.validUntil ? new Date(input.validUntil) : null }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CONTRACT_UPDATED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      targetId: updated.id,
      metadata: {
        creatorId,
        updatedFields: Object.keys(input),
        signedMetadataOnly: contract.status === CreatorContractStatus.SIGNED,
      },
    });

    return toCreatorContract(updated);
  }

  async addContractVersion(
    user: AccessTokenPayload,
    creatorId: string,
    contractId: string,
    input: CreateCreatorContractVersionInput,
  ): Promise<CreatorContractDetail> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    const contract = await this.loadCreatorContract(organizationId, creatorId, contractId);

    assertContractAllowsNewVersion(contract.status as CreatorContractStatusType);

    try {
      validateStorageKey(organizationId, input.storageKey);
    } catch (error) {
      if (error instanceof StorageKeyError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const parsedKey = parseContractVersionStorageKey(creatorId, contractId, input.storageKey);
    const config = loadStorageConfig();
    let validatedUpload;

    try {
      validatedUpload = validateUploadMetadata(
        {
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
        config,
      );
    } catch (error) {
      if (error instanceof UploadValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    assertStorageKeyFileNameMatches(parsedKey.fileName, validatedUpload.fileName);

    const existingVersion = await prisma.creatorContractVersion.findUnique({
      where: { id: parsedKey.versionId },
    });

    if (existingVersion) {
      throw new ConflictException('Contract version already exists for this storage key');
    }

    const versionNumber =
      input.versionNumber ??
      ((
        await prisma.creatorContractVersion.findFirst({
          where: { contractId },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        })
      )?.versionNumber ?? 0) + 1;

    const versionConflict = await prisma.creatorContractVersion.findUnique({
      where: {
        contractId_versionNumber: {
          contractId,
          versionNumber,
        },
      },
    });

    if (versionConflict) {
      throw new ConflictException(`Contract version number ${versionNumber} already exists`);
    }

    const updatedContract = await prisma.$transaction(async (tx) => {
      await tx.creatorContractVersion.create({
        data: {
          id: parsedKey.versionId,
          organizationId,
          contractId,
          versionNumber,
          storageKey: input.storageKey,
          fileName: validatedUpload.fileName,
          mimeType: validatedUpload.mimeType,
          sizeBytes: validatedUpload.sizeBytes,
          checksum: input.checksum ?? null,
          externalEnvelopeId: input.externalEnvelopeId ?? null,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return tx.creatorContract.findUniqueOrThrow({
        where: { id: contractId },
        include: contractInclude,
      });
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CONTRACT_VERSION_ADDED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      targetId: contractId,
      metadata: {
        creatorId,
        versionId: parsedKey.versionId,
        versionNumber,
        mimeType: validatedUpload.mimeType,
        sizeBytes: validatedUpload.sizeBytes,
      },
    });

    return toCreatorContractDetail(updatedContract);
  }

  async updateContractStatus(
    user: AccessTokenPayload,
    creatorId: string,
    contractId: string,
    input: UpdateCreatorContractStatusInput,
  ): Promise<CreatorContract> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    const contract = await this.loadCreatorContract(organizationId, creatorId, contractId, {
      include: contractInclude,
    });

    const currentStatus = contract.status as CreatorContractStatusType;
    const nextStatus = input.status;

    assertAllowedContractStatusTransition(currentStatus, nextStatus);

    if (nextStatus === 'SIGNED') {
      const latestVersion = findLatestUploadedVersion(contract.versions);

      if (!latestVersion?.storageKey) {
        throw new BadRequestException(
          'Cannot mark contract as signed without an uploaded contract version',
        );
      }
    }

    const signedAt = nextStatus === 'SIGNED' ? new Date() : contract.signedAt;

    const updated = await prisma.$transaction(async (tx) => {
      if (nextStatus === 'SIGNED') {
        const latestVersion = findLatestUploadedVersion(contract.versions);

        if (latestVersion) {
          await tx.creatorContractVersion.update({
            where: { id: latestVersion.id },
            data: {
              signedAt,
              signedByUserId: user.sub,
            },
          });
        }
      }

      return tx.creatorContract.update({
        where: { id: contractId },
        data: {
          status: nextStatus,
          ...(nextStatus === 'SIGNED'
            ? {
                signedAt,
                signedByUserId: user.sub,
              }
            : {}),
          ...(nextStatus === 'DRAFT' &&
          (currentStatus === 'EXPIRED' ||
            currentStatus === 'CANCELLED' ||
            currentStatus === 'TERMINATED')
            ? {
                signedAt: null,
                signedByUserId: null,
              }
            : {}),
          ...(input.metadata !== undefined
            ? { metadata: input.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CONTRACT_STATUS_CHANGED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      targetId: contract.id,
      metadata: {
        creatorId,
        previousStatus: currentStatus,
        status: nextStatus,
      },
    });

    return toCreatorContract(updated);
  }

  async signContract(
    user: AccessTokenPayload,
    creatorId: string,
    contractId: string,
    input: SignCreatorContractInput = {},
  ): Promise<CreatorContractDetail> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);
    const contract = await this.loadCreatorContract(organizationId, creatorId, contractId, {
      include: contractInclude,
    });

    if (contract.status === CreatorContractStatus.SIGNED) {
      return toCreatorContractDetail(contract);
    }

    const currentStatus = contract.status as CreatorContractStatusType;
    assertAllowedContractStatusTransition(currentStatus, 'SIGNED');

    const selectedVersion = findLatestUploadedVersion(contract.versions, input.versionId);

    if (!selectedVersion) {
      throw new BadRequestException(
        input.versionId
          ? 'Contract version not found'
          : 'Cannot sign contract without an uploaded contract version',
      );
    }

    if (!selectedVersion.storageKey) {
      throw new BadRequestException('Contract version has no uploaded file');
    }

    const signedAt = input.signedAt ? new Date(input.signedAt) : new Date();
    const signedByUserId = input.signedByUserId ?? user.sub;
    const metadataUpdate = input.note
      ? ({
          ...toMetadataRecord(contract.metadata),
          manualSigningNote: input.note,
        } as Prisma.InputJsonValue)
      : undefined;

    const updatedContract = await prisma.$transaction(async (tx) => {
      await tx.creatorContractVersion.update({
        where: { id: selectedVersion.id },
        data: {
          signedAt,
          signedByUserId,
        },
      });

      return tx.creatorContract.update({
        where: { id: contractId },
        data: {
          status: CreatorContractStatus.SIGNED,
          signedAt,
          signedByUserId,
          ...(metadataUpdate !== undefined ? { metadata: metadataUpdate } : {}),
        },
        include: contractInclude,
      });
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CONTRACT_SIGNED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      targetId: contract.id,
      metadata: {
        creatorId,
        versionId: selectedVersion.id,
        versionNumber: selectedVersion.versionNumber,
        previousStatus: currentStatus,
        signedByUserId,
        signedAt: signedAt.toISOString(),
        ...(input.note ? { note: input.note } : {}),
      },
    });

    return toCreatorContractDetail(updatedContract);
  }

  async downloadContract(
    user: AccessTokenPayload,
    creatorId: string,
    contractId: string,
    input: DownloadCreatorContractInput = {},
  ): Promise<DownloadCreatorContractResponse> {
    const organizationId = await this.requireActiveOrganization(user);
    await this.requireCreatorProfile(organizationId, creatorId);

    const contract = await this.loadCreatorContract(organizationId, creatorId, contractId, {
      include: contractInclude,
    });

    const version = findLatestUploadedVersion(contract.versions, input.versionId);

    if (!version?.storageKey) {
      throw new BadRequestException('No uploaded contract version is available for download');
    }

    try {
      validateStorageKey(organizationId, version.storageKey);
      parseContractVersionStorageKey(creatorId, contractId, version.storageKey);
    } catch (error) {
      if (error instanceof StorageKeyError || error instanceof BadRequestException) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Invalid contract storage key',
        );
      }

      throw error;
    }

    const config = loadStorageConfig();
    const presigned = await getPresignedDownloadUrl({
      storageKey: version.storageKey,
      config,
    });

    await this.auditService.record({
      organizationId,
      actorUserId: user.sub,
      action: AUDIT_ACTION.CREATOR_CONTRACT_DOWNLOADED,
      targetType: AUDIT_TARGET_TYPE.CREATOR_CONTRACT,
      targetId: contract.id,
      metadata: {
        creatorId,
        versionId: version.id,
        versionNumber: version.versionNumber,
        contractType: contract.contractType,
        status: contract.status,
      },
    });

    return {
      contractId: contract.id,
      versionId: version.id,
      storageKey: version.storageKey,
      downloadUrl: presigned.url,
      expiresAt: presigned.expiresAt,
    };
  }

  private async requireActiveOrganization(user: AccessTokenPayload): Promise<string> {
    if (!user.organizationId) {
      throw new ForbiddenException('Active organization context required');
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.sub,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('No active membership in selected organization');
    }

    return user.organizationId;
  }

  private async requireCreatorProfile(organizationId: string, creatorId: string) {
    const profile = await prisma.creatorProfile.findFirst({
      where: { id: creatorId, organizationId },
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }

    return profile;
  }

  private async loadCreatorContract(
    organizationId: string,
    creatorId: string,
    contractId: string,
  ): Promise<PrismaCreatorContract>;
  private async loadCreatorContract(
    organizationId: string,
    creatorId: string,
    contractId: string,
    options: { include: typeof contractInclude },
  ): Promise<CreatorContractWithVersions>;
  private async loadCreatorContract(
    organizationId: string,
    creatorId: string,
    contractId: string,
    options?: {
      include?: typeof contractInclude;
    },
  ): Promise<PrismaCreatorContract | CreatorContractWithVersions> {
    const contract = await prisma.creatorContract.findFirst({
      where: {
        id: contractId,
        organizationId,
        creatorProfileId: creatorId,
        deletedAt: null,
      },
      ...(options?.include ? { include: options.include } : {}),
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }
}
