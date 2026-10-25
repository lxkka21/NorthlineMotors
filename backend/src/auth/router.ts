import { Router } from 'express';
import { authenticate, requireRole } from './middleware.js';
import { UserAdminService } from './admin-service.js';
import { AuthService, credentialsSchema, registrationSchema } from './service.js';
import type { UserRepository } from './types.js';
import { ValidationError } from './errors.js';

function parseCredentials(body: unknown) {
  const result = credentialsSchema.safeParse(body);
  if (!result.success) throw new ValidationError('Email must be valid and password must be at least 12 characters');
  return result.data;
}

function parseRegistration(body: unknown) {
  const result = registrationSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Registration details are invalid');
  return result.data;
}

export function createAuthRouter(users: UserRepository) {
  const router = Router();
  const service = new AuthService(users);
  const adminService = new UserAdminService(users);

  router.post('/register', async (request, response, next) => {
    try {
      response.status(201).json(await service.register(parseRegistration(request.body)));
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

  router.get('/users', authenticate(users), requireRole('admin'), async (_request, response, next) => {
    try { response.json({ users: await adminService.list() }); } catch (error) { next(error); }
  });

  router.patch('/users/:id/role', authenticate(users), requireRole('admin'), async (request, response, next) => {
    try {
      const actorId = request.authUser?.id;
      if (!actorId) throw new Error('Authenticated user missing');
      const targetId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
      response.json({ user: await adminService.assignRole(actorId, targetId, request.body) });
    } catch (error) { next(error); }
  });

  return router;
}
