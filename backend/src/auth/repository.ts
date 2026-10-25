import { supabase } from '../lib/supabase.js';
import type { CreateUserInput, UserRecord, UserRepository, UserRole } from './types.js';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  preferred_contact_method: 'email' | 'phone' | null;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullName: row.full_name ?? undefined,
    phone: row.phone ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    addressLine: row.address_line ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    postalCode: row.postal_code ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
  };
}

export class SupabaseUserRepository implements UserRepository {
  async list() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data as UserRow[]).map(mapUser);
  }

  async findByEmail(email: string) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data as UserRow) : null;
  }

  async findById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data as UserRow) : null;
  }

  async create(input: CreateUserInput) {
    const { data, error } = await supabase
      .from('users')
      .insert({ email: input.email, password_hash: input.passwordHash, role: input.role, full_name: input.fullName, phone: input.phone, date_of_birth: input.dateOfBirth, address_line: input.addressLine, city: input.city, state: input.state, postal_code: input.postalCode, preferred_contact_method: input.preferredContactMethod })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('EMAIL_ALREADY_EXISTS');
      throw error;
    }
    return mapUser(data as UserRow);
  }

  async assignRole(actorId: string, targetId: string, role: UserRole) {
    const { data, error } = await supabase.rpc('assign_user_role', {
      p_actor_id: actorId,
      p_target_id: targetId,
      p_role: role,
    });
    if (error) {
      if (error.code === 'P0006' || error.message?.includes('USER_NOT_FOUND')) return null;
      if (error.code === 'P0007') throw new Error('LAST_ADMIN');
      if (error.code === 'P0005') throw new Error('SELF_ROLE_CHANGE');
      if (error.code === 'P0008') throw new Error('FORBIDDEN');
      throw error;
    }
    return data ? mapUser(data as UserRow) : null;
  }
}
