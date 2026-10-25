import { supabase } from '../lib/supabase.js';
import { hashPassword } from '../auth/password.js';
import { credentialsSchema } from '../auth/service.js';

const confirmation = 'I_UNDERSTAND_INITIAL_ADMIN_PROVISIONING';

async function main() {
  if (process.env.ADMIN_PROVISION_CONFIRM !== confirmation) {
    throw new Error(`No changes made. Set ADMIN_PROVISION_CONFIRM=${confirmation} for a one-time protected setup.`);
  }

  const credentials = credentialsSchema.safeParse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  if (!credentials.success) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be valid; the password must be at least 12 characters');

  const { count, error: countError } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  if (countError) throw countError;
  if ((count ?? 0) > 0) throw new Error('An administrator already exists; refusing to create another initial administrator');

  const { error } = await supabase.from('users').insert({
    email: credentials.data.email,
    password_hash: await hashPassword(credentials.data.password),
    role: 'admin',
  });
  if (error) throw error;
  console.log('Initial administrator provisioned. Remove the provisioning environment variables now.');
}

main().catch((error: unknown) => {
  console.error(`Initial admin provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exitCode = 1;
});
