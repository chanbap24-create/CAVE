import { createClient, User } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase.ts";

export interface AuthContext {
  user: User;
  jwt: string;
}

// Verifies the Authorization: Bearer <jwt> header and returns the user +
// the raw JWT. Returns null on any auth failure. Callers should 401 when null.
export async function requireUser(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const jwt = authHeader.slice("Bearer ".length);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) return null;

  return { user: data.user, jwt };
}
