import { Router } from 'express';
import { authenticate, requireRole } from './middleware.js';
import { AuthService, credentialsSchema } from './service.js';
import { toPublicUser, type UserRepository } from './types.js';
import { ConflictError, ValidationError } from './errors.js';

function parseCredentials(body: unknown) {
  const result = credentialsSchema.safeParse(body);
  if (!result.success) throw new ValidationError('Email must be valid and password must be at least 12 characters');
  return result.data;
}

export function createAuthRouter(users: UserRepository) {
  const router = Router();
  const service = new AuthService(users);

  router.post('/register', async (request, response, next) => {
    try {
      response.status(201).json(await service.register(parseCredentials(request.body)));
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (request, response, next) => {
    try {
      response.json(await service.login(parseCredentials(request.body)));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', authenticate(users), (request, response) => {
    response.json({ user: request.authUser });
  });

  return router;
}
