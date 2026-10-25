import { supabase } from '../lib/supabase.js';
import type { CreateUserInput, UserRecord, UserRepository, UserRole } from './types.js';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseUserRepository implements UserRepository {
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
      .insert({ email: input.email, password_hash: input.passwordHash, role: input.role })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('EMAIL_ALREADY_EXISTS');
      throw error;
    }
    return mapUser(data as UserRow);
  }
}

