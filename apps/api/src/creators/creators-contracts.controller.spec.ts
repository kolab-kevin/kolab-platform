import type { AccessTokenPayload } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatorsContractsController } from './creators-contracts.controller';
import { CreatorsContractsService } from './creators-contracts.service';

describe('CreatorsContractsController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [CreatorsContractsController],
      providers: [
        {
          provide: CreatorsContractsService,
          useValue: {
            listContracts: jest.fn(),
            getContract: jest.fn(),
            createContract: jest.fn(),
            updateContract: jest.fn(),
            addContractVersion: jest.fn(),
            updateContractStatus: jest.fn(),
            signContract: jest.fn(),
            downloadContract: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof CreatorsContractsController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => CreatorsContractsController.prototype[handler],
      getClass: () => CreatorsContractsController,
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

  it('allows recruiters to list contracts with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('listContracts', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing contracts', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(() => permissionsGuard.canActivate(createContext('listContracts', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to create contracts with documents:write', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(permissionsGuard.canActivate(createContext('createContract', recruiterUser))).toBe(true);
  });

  it('denies viewers from updating contract status', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateContractStatus', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to sign contracts with documents:write', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(permissionsGuard.canActivate(createContext('signContract', recruiterUser))).toBe(true);
  });

  it('denies viewers from signing contracts', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:write']);

    expect(() => permissionsGuard.canActivate(createContext('signContract', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to download contracts with documents:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['documents:read']);

    expect(permissionsGuard.canActivate(createContext('downloadContract', recruiterUser))).toBe(
      true,
    );
  });
});
