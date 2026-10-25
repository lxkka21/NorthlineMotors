import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from './types.js';

export interface AuthTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
}

export function signToken(claims: AuthTokenClaims, expiresInSeconds = env.JWT_EXPIRES_IN_SECONDS) {
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string): AuthTokenClaims {
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    (payload.role !== 'user' && payload.role !== 'admin')
  ) {
    throw new Error('Invalid token claims');
  }

  return { sub: payload.sub, email: payload.email, role: payload.role };
}
