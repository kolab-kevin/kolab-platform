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

  const recruiterUser = {
    role: 'USER',
    organizationRole: 'RECRUITER',
    isSystemAdmin: false,
  };

  const viewerUser = {
    role: 'USER',
    organizationRole: 'VIEWER',
    isSystemAdmin: false,
  };

  it('allows recruiters to list documents with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listDocuments', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing documents', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listDocuments', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to create documents with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('createDocument', recruiterUser))).toBe(true);
  });

  it('denies viewers from reviewing documents', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('reviewDocument', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to download documents with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('downloadDocument', recruiterUser))).toBe(
      true,
    );
  });
});
