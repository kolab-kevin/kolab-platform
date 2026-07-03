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

  it('allows recruiters to list contracts with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listContracts', recruiterUser))).toBe(true);
  });

  it('denies viewers from listing contracts', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listContracts', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to create contracts with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('createContract', recruiterUser))).toBe(true);
  });

  it('denies viewers from updating contract status', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('updateContractStatus', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to download contracts with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('downloadContract', recruiterUser))).toBe(
      true,
    );
  });
});
