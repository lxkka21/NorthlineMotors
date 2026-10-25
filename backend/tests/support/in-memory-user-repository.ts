import type { CreateUserInput, UserRecord, UserRepository, UserRole } from '../../src/auth/types.js';

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
      fullName: input.fullName, phone: input.phone, dateOfBirth: input.dateOfBirth, addressLine: input.addressLine, city: input.city, state: input.state, postalCode: input.postalCode, preferredContactMethod: input.preferredContactMethod,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.email, user);
    return user;
  }

  list() {
    return [...this.users.values()];
  }

  assignRole(actorId: string, id: string, role: UserRole) {
    if (actorId === id) throw new Error('SELF_ROLE_CHANGE');
    const user = this.findById(id);
    if (!user) return null;
    if (user.role === 'admin' && role !== 'admin' && [...this.users.values()].filter((item) => item.role === 'admin').length <= 1) {
      throw new Error('LAST_ADMIN');
    }
    const updated = { ...user, role, updatedAt: new Date().toISOString() };
    this.users.set(user.email, updated);
    return updated;
  }
}
