import type { CreateUserInput, UserRecord, UserRepository } from '../../src/auth/types.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserRecord>();

  clear() {
    this.users.clear();
  }

  seed(user: UserRecord) {
    this.users.set(user.email, user);
  }

  findByEmail(email: string) {
    return this.users.get(email) ?? null;
  }

  findById(id: string) {
    return [...this.users.values()].find((user) => user.id === id) ?? null;
  }

  create(input: CreateUserInput) {
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: `user-${this.users.size + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.email, user);
    return user;
  }
}

