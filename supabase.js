import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set them in Cloudflare Workers Builds environment variables, ' +
      'or in GitHub Actions secrets before running the build.'
  );
}

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default supabase;
