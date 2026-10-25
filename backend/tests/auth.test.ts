import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import { signToken } from '../src/auth/token.js';
import type { UserRecord, UserRepository } from '../src/auth/types.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const repository = new InMemoryUserRepository();
const app = createApp({ userRepository: repository });

beforeEach(() => {
  repository.clear();
});

describe('POST /api/auth/register', () => {
  it('registers a user with a hashed password and never returns the hash', async () => {
    const response = await request(app).post('/api/auth/register').send({
      fullName: 'Test Driver', phone: '+1234567890', email: 'Driver@example.com',
      password: 'correct horse battery staple', confirmPassword: 'correct horse battery staple',
      role: 'admin',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: 'driver@example.com', role: 'user' });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.token).toEqual(expect.any(String));

    const stored = repository.findByEmail('driver@example.com');
    expect(stored?.passwordHash).not.toBe('correct horse battery staple');
  });

  it('stores profile fields while keeping the password private', async () => {
    const response = await request(app).post('/api/auth/register').send({
      fullName: 'A Northline Customer', phone: '+91 63665 82056', email: 'profile@example.com',
      password: 'correct horse battery staple', confirmPassword: 'correct horse battery staple',
      city: 'Bengaluru', preferredContactMethod: 'phone', role: 'admin',
    });
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ fullName: 'A Northline Customer', phone: '+91 63665 82056', city: 'Bengaluru', preferredContactMethod: 'phone', role: 'user' });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(repository.findByEmail('profile@example.com')).toMatchObject({ fullName: 'A Northline Customer', city: 'Bengaluru' });
  });

  it('rejects mismatched passwords and malformed phone numbers', async () => {
    const response = await request(app).post('/api/auth/register').send({ fullName: 'Invalid Customer', phone: 'not-a-phone', email: 'invalid@example.com', password: 'correct horse battery staple', confirmPassword: 'different password' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects duplicate email addresses', async () => {
    await request(app).post('/api/auth/register').send({
      fullName: 'Duplicate User', phone: '+1234567890', email: 'duplicate@example.com',
      password: 'correct horse battery staple', confirmPassword: 'correct horse battery staple',
    });

    const response = await request(app).post('/api/auth/register').send({
      fullName: 'Duplicate User', phone: '+1234567890', email: 'DUPLICATE@example.com',
      password: 'another secure password', confirmPassword: 'another secure password',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('rejects invalid registration input', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs safe database error details while keeping the client response generic', async () => {
    const databaseError = Object.assign(new Error('fetch failed'), {
      code: 'FETCH_FAILED',
      cause: Object.assign(new Error('unable to verify the first certificate'), {
        code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      }),
    });
    const failingRepository: UserRepository = {
      findByEmail: async () => { throw databaseError; },
      findById: async () => null,
      create: async () => { throw databaseError; },
    };
    const failingApp = createApp({ userRepository: failingRepository });
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(failingApp).post('/api/auth/register').send({
      fullName: 'Diagnostic User', phone: '+1234567890', email: 'diagnostic@example.invalid',
      password: 'correct horse battery staple', confirmPassword: 'correct horse battery staple',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
    });
    expect(log).toHaveBeenCalledWith('Unhandled request error', {
      name: 'Error',
      message: 'fetch failed',
      code: 'FETCH_FAILED',
      cause: {
        name: 'Error',
        message: 'unable to verify the first certificate',
        code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      },
    });
    log.mockRestore();
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the stored password and returns a JWT', async () => {
    await request(app).post('/api/auth/register').send({
      fullName: 'Login User', phone: '+1234567890', email: 'login@example.com',
      password: 'correct horse battery staple', confirmPassword: 'correct horse battery staple',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'LOGIN@example.com',
      password: 'correct horse battery staple',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rejects an incorrect password without revealing whether the email exists', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'login@example.com',
      password: 'correct horse battery staple',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'incorrect password',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('authentication and role authorization', () => {
  it('rejects missing, invalid, and expired bearer tokens', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')).status).toBe(401);

    const expiredToken = signToken({ sub: 'expired-user', email: 'expired@example.com', role: 'user' }, -1);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('allows an authenticated user to access /me', async () => {
    const user: UserRecord = {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: await hashPassword('correct horse battery staple'),
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    repository.seed(user);

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: user.id, email: user.email, role: user.role });
  });

  it('enforces admin-only access based on the database role', async () => {
    const user: UserRecord = {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: await hashPassword('correct horse battery staple'),
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    repository.seed(user);
    const userToken = signToken({ sub: user.id, email: user.email, role: user.role });

    const forbidden = await request(app).get('/api/admin/ping').set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');

    const admin: UserRecord = { ...user, id: 'admin-id', email: 'admin@example.com', role: 'admin' };
    repository.seed(admin);
    const adminToken = signToken({ sub: admin.id, email: admin.email, role: admin.role });
    const allowed = await request(app).get('/api/admin/ping').set('Authorization', `Bearer ${adminToken}`);

    expect(allowed.status).toBe(200);
  });
});
