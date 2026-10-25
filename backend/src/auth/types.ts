export type UserRole = 'admin' | 'user';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  preferredContactMethod?: 'email' | 'phone';
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  preferredContactMethod?: 'email' | 'phone';
}

export interface UserRepository {
  findByEmail(email: string): UserRecord | null | Promise<UserRecord | null>;
  findById(id: string): UserRecord | null | Promise<UserRecord | null>;
  create(input: CreateUserInput): UserRecord | Promise<UserRecord>;
  list(): UserRecord[] | Promise<UserRecord[]>;
  assignRole(actorId: string, targetId: string, role: UserRole): UserRecord | null | Promise<UserRecord | null>;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  preferredContactMethod?: 'email' | 'phone';
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id, email: user.email, role: user.role,
    ...(user.fullName ? { fullName: user.fullName } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.dateOfBirth ? { dateOfBirth: user.dateOfBirth } : {}),
    ...(user.addressLine ? { addressLine: user.addressLine } : {}),
    ...(user.city ? { city: user.city } : {}),
    ...(user.state ? { state: user.state } : {}),
    ...(user.postalCode ? { postalCode: user.postalCode } : {}),
    ...(user.preferredContactMethod ? { preferredContactMethod: user.preferredContactMethod } : {}),
  };
}
