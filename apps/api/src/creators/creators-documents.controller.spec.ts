import type { AccessTokenPayload } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatorsDocumentsController } from './creators-documents.controller';
import { CreatorsDocumentsService } from './creators-documents.service';

describe('CreatorsDocumentsController authorization', () => {
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

  const createUser = (
    organizationRole: AccessTokenPayload['organizationRole'],
  ): AccessTokenPayload => ({
    sub: 'user-1',
    email: 'user@kolab.test',
    role: 'USER',
    organizationId: 'org-1',
    organizationRole,
    sessionId: 'session-1',
    isSystemAdmin: false,
  });

  const recruiterUser = createUser('RECRUITER');
  const viewerUser = createUser('VIEWER');

  it('allows recruiters to list documents with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('listDocuments', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing documents', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(() => permissionsGuard.canActivate(createContext('listDocuments', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to create documents with documents:write', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(permissionsGuard.canActivate(createContext('createDocument', recruiterUser))).toBe(true);
  });

  it('denies recruiters from reviewing documents without documents:review', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:review']);

    expect(() =>
      permissionsGuard.canActivate(createContext('reviewDocument', recruiterUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to reach download endpoint with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('downloadDocument', recruiterUser))).toBe(
      true,
    );
  });
});
