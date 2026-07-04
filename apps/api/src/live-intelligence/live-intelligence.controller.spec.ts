import type { AccessTokenPayload } from '@kolab/auth';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { LiveIntelligenceController } from './live-intelligence.controller';
import { LiveIntelligenceService } from './live-intelligence.service';
import { LiveIntelligenceEventsService } from './live-intelligence-events.service';
import { LiveIntelligenceGifterRollupsService } from './live-intelligence-gifter-rollups.service';
import { LiveIntelligenceGiftersService } from './live-intelligence-gifters.service';
import { LiveIntelligenceTimelineService } from './live-intelligence-timeline.service';

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
        {
          provide: LiveIntelligenceEventsService,
          useValue: {
            ingestEvent: jest.fn(),
            ingestEventBatch: jest.fn(),
            listSessionEvents: jest.fn(),
          },
        },
        {
          provide: LiveIntelligenceGiftersService,
          useValue: {
            listGifterProfiles: jest.fn(),
            getGifterProfile: jest.fn(),
            listGifterSessions: jest.fn(),
            listSessionGifters: jest.fn(),
          },
        },
        {
          provide: LiveIntelligenceGifterRollupsService,
          useValue: {
            processGifterRollups: jest.fn(),
          },
        },
        {
          provide: LiveIntelligenceTimelineService,
          useValue: {
            getSessionTimeline: jest.fn(),
            getSessionReplay: jest.fn(),
            getSessionHighlights: jest.fn(),
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

  it('allows recruiters to read session events with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listSessionEvents', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers ingesting events without crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() => permissionsGuard.canActivate(createContext('ingestEvent', viewerUser))).toThrow(
      ForbiddenException,
    );
  });

  it('allows recruiters to list gifter profiles with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('listGifterProfiles', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers reading gifter profiles without crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getGifterProfile', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to process gifter rollups with crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(permissionsGuard.canActivate(createContext('processGifterRollups', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers processing gifter rollups without crm:update', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:update']);

    expect(() =>
      permissionsGuard.canActivate(createContext('processGifterRollups', viewerUser)),
    ).toThrow(ForbiddenException);
  });

  it('allows recruiters to read session timeline with crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(permissionsGuard.canActivate(createContext('getSessionTimeline', recruiterUser))).toBe(
      true,
    );
  });

  it('denies viewers reading session replay without crm:read', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['crm:read']);

    expect(() =>
      permissionsGuard.canActivate(createContext('getSessionReplay', viewerUser)),
    ).toThrow(ForbiddenException);
  });
});
