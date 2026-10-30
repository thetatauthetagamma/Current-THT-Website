// middleware/auth.ts
import supabase from './supabase';
import { rolesFromRpc, NO_ROLES } from './utils/roles';

const emailOf = (userEmail) => (typeof userEmail === 'string' ? userEmail : userEmail?.value) || '';

// One narrow SQL function (scripts/alumni/sql/004_role_lookup.sql) instead of reading Brothers/Pledges.
export async function getRoles(userEmail, client = supabase) {
  const email = emailOf(userEmail);
  if (!email) return NO_ROLES;
  try {
    const { data, error } = await client.rpc('role_for_email', { p_email: email });
    if (!error) return rolesFromRpc(data);
    // TODO: delete this fallback once 004_role_lookup.sql is live everywhere. It only keeps the site
    // working if this code is deployed before the SQL has been run (PGRST202 = function not found).
    if (error.code === 'PGRST202') return await legacyRoles(email, client);
    console.error('role_for_email failed:', error.message);
  } catch (error) {
    console.error('Error checking roles:', error);
  }
  return NO_ROLES;
}

async function legacyRoles(email, client) {
  const [b, p] = await Promise.all([
    client.from('Brothers').select('adminrole').eq('email', email),
    client.from('Pledges').select('email').eq('email', email),
  ]);
  return {
    isBrother: b.data?.length === 1 && !b.error,
    isPledge: p.data?.length === 1 && !p.error,
    adminRole: b.data?.[0]?.adminrole || '',
  };
}

export const isBrother = async (userEmail) => (await getRoles(userEmail)).isBrother;
export const isPledge = async (userEmail) => (await getRoles(userEmail)).isPledge;
export const isAdmin = async (userEmail) => Boolean((await getRoles(userEmail)).adminRole);
export const isParentAdmin = async (userEmail) => (await getRoles(userEmail)).adminRole === 'parent';
