import type { Role } from '@kolab/types';
import jwt, { type SignOptions } from 'jsonwebtoken';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

export type JwtConfig = {
  secret: string;
  accessExpiry: string;
};

export function signAccessToken(
  payload: AccessTokenPayload,
  config: JwtConfig,
): { token: string; expiresIn: number } {
  const options: SignOptions = {
    expiresIn: config.accessExpiry as SignOptions['expiresIn'],
    issuer: 'kolab-platform',
    audience: 'kolab-api',
  };

  const token = jwt.sign(payload, config.secret, options);

  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

  return { token, expiresIn };
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  const payload = jwt.verify(token, secret, {
    issuer: 'kolab-platform',
    audience: 'kolab-api',
  }) as jwt.JwtPayload;

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as Role,
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
