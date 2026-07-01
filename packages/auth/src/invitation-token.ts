import { createHash, randomBytes } from 'crypto';

export function generateInvitationToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
