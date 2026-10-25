import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// This module is backend-only. SUPABASE_SECRET_KEY must never be sent to the browser.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

