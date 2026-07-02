import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: {
            presignUpload: jest.fn(),
            presignDownload: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof StorageController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => StorageController.prototype[handler],
      getClass: () => StorageController,
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

  it('allows recruiters to presign uploads with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('presignUpload', recruiterUser))).toBe(true);
  });

  it('denies viewers from presign uploads', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('presignUpload', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to presign downloads with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('presignDownload', recruiterUser))).toBe(
      true,
    );
  });
});
