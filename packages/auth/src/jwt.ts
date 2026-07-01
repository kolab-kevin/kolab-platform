import type { OrganizationRole, Role } from '@kolab/types';
import jwt, { type SignOptions } from 'jsonwebtoken';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  /** Phase 1 legacy claim — always populated after verification. */
  role: Role;
  organizationId?: string;
  organizationRole?: OrganizationRole;
  sessionId?: string;
  isSystemAdmin: boolean;
};

export type SignAccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  organizationId?: string;
  organizationRole?: OrganizationRole;
  sessionId?: string;
  isSystemAdmin?: boolean;
};

export type JwtConfig = {
  secret: string;
  accessExpiry: string;
};

function buildJwtClaims(payload: SignAccessTokenPayload): Record<string, unknown> {
  const claims: Record<string, unknown> = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    isSystemAdmin: payload.isSystemAdmin ?? false,
  };

  if (payload.organizationId) {
    claims.organizationId = payload.organizationId;
  }

  if (payload.organizationRole) {
    claims.organizationRole = payload.organizationRole;
  }

  if (payload.sessionId) {
    claims.sessionId = payload.sessionId;
  }

  return claims;
}

export function signAccessToken(
  payload: SignAccessTokenPayload,
  config: JwtConfig,
): { token: string; expiresIn: number } {
  const options: SignOptions = {
    expiresIn: config.accessExpiry as SignOptions['expiresIn'],
    issuer: 'kolab-platform',
    audience: 'kolab-api',
  };

  const token = jwt.sign(buildJwtClaims(payload), config.secret, options);

  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

  return { token, expiresIn };
}

function readOrganizationId(payload: jwt.JwtPayload): string | undefined {
  const value = payload.organizationId ?? payload.orgId;
  return typeof value === 'string' ? value : undefined;
}

function readOrganizationRole(payload: jwt.JwtPayload): OrganizationRole | undefined {
  const value = payload.organizationRole ?? payload.orgRole;
  return typeof value === 'string' ? (value as OrganizationRole) : undefined;
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  const payload = jwt.verify(token, secret, {
    issuer: 'kolab-platform',
    audience: 'kolab-api',
  }) as jwt.JwtPayload;

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: (payload.role as Role | undefined) ?? 'USER',
    organizationId: readOrganizationId(payload),
    organizationRole: readOrganizationRole(payload),
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : undefined,
    isSystemAdmin: payload.isSystemAdmin === true,
  };
}

export function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}
