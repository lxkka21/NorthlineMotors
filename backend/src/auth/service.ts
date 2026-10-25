import { z } from 'zod';
import { ConflictError, AuthenticationError } from './errors.js';
import { hashPassword, verifyPassword } from './password.js';
import { signToken } from './token.js';
import { toPublicUser, type UserRepository } from './types.js';

export const credentialsSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: z.infer<typeof credentialsSchema>) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError();

    let user;
    try {
      user = await this.users.create({
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: 'user',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') throw new ConflictError();
      throw error;
    }

    return { user: toPublicUser(user), token: signToken({ sub: user.id, email: user.email, role: user.role }) };
  }

  async login(input: z.infer<typeof credentialsSchema>) {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AuthenticationError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    return { user: toPublicUser(user), token: signToken({ sub: user.id, email: user.email, role: user.role }) };
  }
}
