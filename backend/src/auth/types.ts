export type UserRole = 'user' | 'admin';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findByEmail(email: string): UserRecord | null | Promise<UserRecord | null>;
  findById(id: string): UserRecord | null | Promise<UserRecord | null>;
  create(input: CreateUserInput): UserRecord | Promise<UserRecord>;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, role: user.role };
}

