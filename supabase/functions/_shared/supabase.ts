import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Service role client — bypasses RLS. Use for trusted server-side writes
// (e.g. recording Mux upload ownership) and for owner-verification SELECTs
// where the caller's RLS context shouldn't apply.
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Anon client with the caller's JWT attached — SELECT/INSERT/etc. run under
// the caller's RLS context. Use when checking "can this user see X".
export function userClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
