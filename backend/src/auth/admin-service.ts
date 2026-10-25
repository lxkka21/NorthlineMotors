import { z } from 'zod';
import { ConflictError, ForbiddenError, UserNotFoundError, ValidationError } from './errors.js';
import { toPublicUser, type UserRepository, type UserRole } from './types.js';

export const roleAssignmentSchema = z.object({ role: z.enum(['admin', 'user']) });

export class UserAdminService {
  constructor(private readonly users: UserRepository) {}

  async list() {
    return (await this.users.list()).map(toPublicUser);
  }

  async assignRole(actorId: string, targetId: string, requestedRole: unknown) {
    const parsed = roleAssignmentSchema.safeParse(requestedRole);
    if (!parsed.success) throw new ValidationError('Role must be admin or user');
    if (actorId === targetId) throw new ForbiddenError();

    const role = parsed.data.role as UserRole;
    try {
      const updated = await this.users.assignRole(actorId, targetId, role);
      if (!updated) throw new UserNotFoundError();
      return toPublicUser(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'LAST_ADMIN') {
        throw new ConflictError('LAST_ADMIN', 'The last administrator cannot be demoted');
      }
      if (error instanceof Error && error.message === 'SELF_ROLE_CHANGE') throw new ForbiddenError();
      if (error instanceof Error && error.message === 'FORBIDDEN') throw new ForbiddenError();
      throw error;
    }
  }
}
