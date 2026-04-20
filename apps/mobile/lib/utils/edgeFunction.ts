import { supabase } from '@/lib/supabase';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

/** Standard JSON + bearer headers for Supabase Edge Function calls. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

/** Absolute URL for `supabase/functions/<name>`. */
export function edgeFunctionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}
