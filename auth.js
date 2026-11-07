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
    console.error('role_for_email failed:', error.message);
  } catch (error) {
    console.error('Error checking roles:', error);
  }
  return NO_ROLES;
}

export const isBrother = async (userEmail) => (await getRoles(userEmail)).isBrother;
export const isPledge = async (userEmail) => (await getRoles(userEmail)).isPledge;
export const isAdmin = async (userEmail) => Boolean((await getRoles(userEmail)).adminRole);
export const isParentAdmin = async (userEmail) => (await getRoles(userEmail)).adminRole === 'parent';
