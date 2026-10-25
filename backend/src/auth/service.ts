import { z } from 'zod';
import { ConflictError, AuthenticationError } from './errors.js';
import { hashPassword, verifyPassword } from './password.js';
import { signToken } from './token.js';
import { toPublicUser, type UserRepository } from './types.js';

export const credentialsSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});

const phoneSchema = z.string().trim().regex(/^\+?[0-9\s().-]{7,25}$/, 'Phone number is invalid');
const optionalText = z.string().trim().max(100).optional();
export const registrationSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  confirmPassword: z.string().min(12).max(128),
  dateOfBirth: z.string().date().optional(),
  addressLine: optionalText,
  city: optionalText,
  state: optionalText,
  postalCode: z.string().trim().max(20).optional(),
  preferredContactMethod: z.enum(['email', 'phone']).optional(),
}).refine((value) => value.password === value.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: z.infer<typeof registrationSchema>) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError();

    let user;
    try {
      user = await this.users.create({
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: 'user',
        fullName: input.fullName,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        addressLine: input.addressLine,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        preferredContactMethod: input.preferredContactMethod,
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
