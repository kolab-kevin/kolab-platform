import type { AccessTokenPayload } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { LiveIntelligenceController } from './live-intelligence.controller';
import { LiveIntelligenceService } from './live-intelligence.service';

describe('LiveIntelligenceController authorization', () => {
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);

    await Test.createTestingModule({
      controllers: [LiveIntelligenceController],
      providers: [
        {
          provide: LiveIntelligenceService,
          useValue: {
            listSessions: jest.fn(),
            getSession: jest.fn(),
            createSession: jest.fn(),
            updateSession: jest.fn(),
            updateSessionStatus: jest.fn(),
            listSchedules: jest.fn(),
            getSchedule: jest.fn(),
            createSchedule: jest.fn(),
            updateSchedule: jest.fn(),
            deleteSchedule: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  const createContext = (
    handler: keyof LiveIntelligenceController,
    user: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => LiveIntelligenceController.prototype[handler],
      getClass: () => LiveIntelligenceController,
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

  it('allows recruiters to list sessions with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listSessions', recruiterUser))).toBe(true);
  });

  it('denies viewers listing sessions without crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() => permissionsGuard.canActivate(createContext('listSessions', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to create sessions with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('createSession', recruiterUser))).toBe(true);
  });

  it('denies viewers creating sessions without crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('createSession', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to delete schedules with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('deleteSchedule', recruiterUser))).toBe(true);
  });

  it('denies viewers deleting schedules without crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('deleteSchedule', viewerUser))).toThrow(
      ForbiddenException,
    );
  });
});
