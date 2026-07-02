import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';

describe('CreatorsController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [CreatorsController],
      providers: [
        {
          provide: CreatorsService,
          useValue: {
            listCreators: jest.fn(),
            getCreator: jest.fn(),
            updateCreator: jest.fn(),
            listCreatorPlatformAccounts: jest.fn(),
            createCreatorPlatformAccount: jest.fn(),
            updateCreatorPlatformAccount: jest.fn(),
            deleteCreatorPlatformAccount: jest.fn(),
            getCreatorSkills: jest.fn(),
            updateCreatorSkills: jest.fn(),
            getCreatorAvailability: jest.fn(),
            updateCreatorAvailability: jest.fn(),
            convertLeadFromRecruitment: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof CreatorsController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => CreatorsController.prototype[handler],
      getClass: () => CreatorsController,
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

  it('allows recruiters to list creators with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listCreators', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing creators', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listCreators', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to update creators with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('updateCreator', recruiterUser))).toBe(true);
  });

  it('denies viewers from updating creators', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('updateCreator', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to list platform accounts with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(
      permissionsGuard.canActivate(createContext('listCreatorPlatformAccounts', recruiterUser)),
    ).toBe(true);
  });

  it('denies viewers from creating platform accounts', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('createCreatorPlatformAccount', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to delete platform accounts with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(
      permissionsGuard.canActivate(createContext('deleteCreatorPlatformAccount', recruiterUser)),
    ).toBe(true);
  });

  it('allows recruiters to read skills with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('getCreatorSkills', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers from updating skills', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateCreatorSkills', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('denies viewers from updating availability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateCreatorAvailability', viewerUser)),
    ).toThrow(ForbiddenException);
  });
});
