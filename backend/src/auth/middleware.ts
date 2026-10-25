import type { NextFunction, Request, Response } from 'express';
import { AuthenticationError, ForbiddenError } from './errors.js';
import { verifyToken } from './token.js';
import { toPublicUser, type PublicUser, type UserRepository, type UserRole } from './types.js';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: PublicUser;
  }
}

export function authenticate(users: UserRepository) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const header = request.header('authorization');
      if (!header?.startsWith('Bearer ')) {
        throw new AuthenticationError('INVALID_TOKEN', 'A bearer token is required');
      }

      const claims = verifyToken(header.slice('Bearer '.length));
      const user = await users.findById(claims.sub);
      if (!user) throw new AuthenticationError('INVALID_TOKEN', 'The token is no longer valid');

      request.authUser = toPublicUser(user);
      next();
    } catch {
      next(new AuthenticationError('INVALID_TOKEN', 'The token is invalid or expired'));
    }
  };
}

export function requireRole(role: UserRole) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (request.authUser?.role !== role) return next(new ForbiddenError());
    next();
  };
}
