import type { AccessTokenPayload } from '@kolab/auth';
import { organizationRoleHasPermission, userHasPermission } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatorsDocumentsController } from './creators-documents.controller';
import { CreatorsDocumentsService } from './creators-documents.service';

const createUser = (
  organizationRole: AccessTokenPayload['organizationRole'],
  isSystemAdmin = false,
): AccessTokenPayload => ({
  sub: 'user-1',
  email: 'user@kolab.test',
  role: 'USER',
  organizationId: 'org-1',
  organizationRole,
  sessionId: 'session-1',
  isSystemAdmin,
});

describe('creator document permission matrix', () => {
  it('grants all document permissions to org owners, org admins, and agency managers', () => {
    for (const role of ['ORG_OWNER', 'ORG_ADMIN', 'AGENCY_MANAGER'] as const) {
      expect(organizationRoleHasPermission(role, 'documents:read')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:write')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:review')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:download_sensitive')).toBe(true);
    }
  });

  it('grants recruiters read and write but not review or sensitive download', () => {
    expect(organizationRoleHasPermission('RECRUITER', 'documents:read')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'documents:write')).toBe(true);
    expect(organizationRoleHasPermission('RECRUITER', 'documents:review')).toBe(false);
    expect(organizationRoleHasPermission('RECRUITER', 'documents:download_sensitive')).toBe(false);
  });

  it('grants support and finance read-only document access', () => {
    for (const role of ['SUPPORT', 'FINANCE'] as const) {
      expect(organizationRoleHasPermission(role, 'documents:read')).toBe(true);
      expect(organizationRoleHasPermission(role, 'documents:write')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:review')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:download_sensitive')).toBe(false);
    }
  });

  it('denies document permissions to viewers, creators, and moderators', () => {
    for (const role of ['VIEWER', 'CREATOR', 'MODERATOR'] as const) {
      expect(organizationRoleHasPermission(role, 'documents:read')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:write')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:review')).toBe(false);
      expect(organizationRoleHasPermission(role, 'documents:download_sensitive')).toBe(false);
    }
  });

  it('allows system administrators to bypass document permission checks', () => {
    const viewerAdmin = createUser('VIEWER', true);

    expect(userHasPermission(viewerAdmin, 'documents:download_sensitive')).toBe(true);
    expect(userHasPermission(viewerAdmin, 'documents:review')).toBe(true);
  });
});

describe('CreatorsDocumentsController document permissions', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [CreatorsDocumentsController],
      providers: [
        {
          provide: CreatorsDocumentsService,
          useValue: {
            listDocuments: jest.fn(),
            getDocument: jest.fn(),
            createDocument: jest.fn(),
            updateDocument: jest.fn(),
            addDocumentVersion: jest.fn(),
            reviewDocument: jest.fn(),
            downloadDocument: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof CreatorsDocumentsController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => CreatorsDocumentsController.prototype[handler],
      getClass: () => CreatorsDocumentsController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const recruiterUser = createUser('RECRUITER');
  const managerUser = createUser('AGENCY_MANAGER');
  const supportUser = createUser('SUPPORT');
  const financeUser = createUser('FINANCE');
  const viewerUser = createUser('VIEWER');
  const systemAdminUser = createUser('VIEWER', true);

  it('allows recruiters to create documents with documents:write', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(permissionsGuard.canActivate(createContext('createDocument', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing documents', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(() => permissionsGuard.canActivate(createContext('listDocuments', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows support read-only document listing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('listDocuments', supportUser))).toBe(true);
  });

  it('allows finance read-only document listing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('getDocument', financeUser))).toBe(true);
  });

  it('denies support from creating documents', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(() =>
      permissionsGuard.canActivate(createContext('createDocument', supportUser)),
    ).toThrow(ForbiddenException);
  });

  it('requires documents:review for review workflow', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:review']);

    expect(() =>
      permissionsGuard.canActivate(createContext('reviewDocument', recruiterUser)),
    ).toThrow(ForbiddenException);
    expect(permissionsGuard.canActivate(createContext('reviewDocument', managerUser))).toBe(true);
  });

  it('allows recruiters to reach download endpoint with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('downloadDocument', recruiterUser))).toBe(
      true,
    );
  });

  it('allows system administrators to bypass document route permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:review']);

    expect(permissionsGuard.canActivate(createContext('reviewDocument', systemAdminUser))).toBe(
      true,
    );
  });
});
