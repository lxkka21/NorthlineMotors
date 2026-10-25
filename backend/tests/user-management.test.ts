import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { UserAdminService } from '../src/auth/admin-service.js';
import { signToken } from '../src/auth/token.js';
import type { UserRecord } from '../src/auth/types.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();
const app = createApp({ userRepository: users });
const timestamp = new Date().toISOString();

const user = (id: string, email: string, role: UserRecord['role']): UserRecord => ({
  id, email, role, passwordHash: 'not-used', createdAt: timestamp, updatedAt: timestamp,
});
const token = (record: UserRecord) => signToken({ sub: record.id, email: record.email, role: record.role });

beforeEach(() => users.clear());

describe('role authorization and user management', () => {
  it('assigns user on public registration even when a role is supplied', async () => {
    const response = await request(app).post('/api/auth/register').send({ fullName: 'Role Test', phone: '+1234567890', email: 'role@example.com', password: 'correct horse battery staple', confirmPassword: 'correct horse battery staple', role: 'admin' });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
  });

  it('denies users from admin user management', async () => {
    const role = 'user' as const;
    const account = user(`${role}-id`, `${role}@example.com`, role);
    users.seed(account);
    expect((await request(app).get('/api/auth/users').set('Authorization', `Bearer ${token(account)}`)).status).toBe(403);
  });

  it('allows an admin to list users and assign user/admin roles', async () => {
    const admin = user('admin-id', 'admin@example.com', 'admin');
    const customer = user('customer-id', 'customer@example.com', 'user');
    users.seed(admin); users.seed(customer);
    const listed = await request(app).get('/api/auth/users').set('Authorization', `Bearer ${token(admin)}`);
    expect(listed.status).toBe(200);
    expect(listed.body.users).toEqual(expect.arrayContaining([expect.objectContaining({ role: 'user' })]));

    const userResponse = await request(app).patch('/api/auth/users/customer-id/role').set('Authorization', `Bearer ${token(admin)}`).send({ role: 'user' });
    expect(userResponse.status).toBe(200);
    expect(userResponse.body.user.role).toBe('user');
    const adminResponse = await request(app).patch('/api/auth/users/customer-id/role').set('Authorization', `Bearer ${token(admin)}`).send({ role: 'admin' });
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.user.role).toBe('admin');
  });

  it('prevents self-promotion or self-demotion', async () => {
    const admin = user('admin-id', 'admin@example.com', 'admin');
    users.seed(admin);
    const response = await request(app).patch('/api/auth/users/admin-id/role').set('Authorization', `Bearer ${token(admin)}`).send({ role: 'user' });
    expect(response.status).toBe(403);
  });

  it('protects the last administrator from demotion', async () => {
    const admin = user('admin-id', 'admin@example.com', 'admin');
    const regular = user('regular-id', 'regular@example.com', 'user');
    users.seed(admin); users.seed(regular);
    const response = await request(app).patch('/api/auth/users/admin-id/role').set('Authorization', `Bearer ${token(regular)}`).send({ role: 'user' });
    expect(response.status).toBe(403);

    const direct = await request(app).patch('/api/auth/users/admin-id/role').set('Authorization', `Bearer ${token(admin)}`).send({ role: 'user' });
    expect(direct.status).toBe(403);

    const secondAdmin = user('admin-2', 'admin2@example.com', 'admin');
    users.seed(secondAdmin);
    const allowed = await request(app).patch('/api/auth/users/admin-id/role').set('Authorization', `Bearer ${token(secondAdmin)}`).send({ role: 'user' });
    expect(allowed.status).toBe(200);
  });

  it('rejects a last-admin demotion at the service boundary', async () => {
    const admin = user('admin-id', 'admin@example.com', 'admin');
    users.seed(admin);
    await expect(new UserAdminService(users).assignRole('another-admin-id', admin.id, { role: 'user' })).rejects.toMatchObject({ code: 'LAST_ADMIN' });
  });

  it('uses the current database role instead of stale JWT claims', async () => {
    const admin = user('admin-id', 'admin@example.com', 'admin');
    const target = user('target-id', 'target@example.com', 'user');
    users.seed(admin); users.seed(target);
    const staleUserToken = token(target);
    await request(app).patch('/api/auth/users/target-id/role').set('Authorization', `Bearer ${token(admin)}`).send({ role: 'admin' });
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${staleUserToken}`);
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('admin');
  });
});
