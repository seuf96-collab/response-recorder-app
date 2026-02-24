import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - works with HTTP (no TCP needed for Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local or Vercel project settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] Client initialized');
console.log('[Supabase] URL:', supabaseUrl);
