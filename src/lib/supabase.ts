import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: SUPABASE_URL');
}

/**
 * Public Supabase client — uses the publishable key.
 * Safe to use in client-side code or for general-purpose queries
 * that follow row-level security (RLS) policies.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

/**
 * Admin Supabase client — uses the secret key.
 * Use ONLY in server-side code (API routes, server actions) — NEVER expose to the client.
 * This client bypasses row-level security (RLS).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);
