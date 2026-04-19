// Issues a short-lived Mux signed-playback JWT for a playback_id the caller
// has access to. Playback URL usage: https://stream.mux.com/{playback_id}.m3u8?token={jwt}
//
// Ownership check (cheapest path first):
//   1. The user uploaded this playback_id themselves (mux_uploads.user_id).
//   2. OR the playback_id is attached to a posts row the user can SELECT via RLS.
//
// Mux docs: https://docs.mux.com/guides/secure-video-playback
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.9.6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MUX_SIGNING_KEY_ID = Deno.env.get("MUX_SIGNING_KEY_ID");
const MUX_SIGNING_PRIVATE_KEY = Deno.env.get("MUX_SIGNING_PRIVATE_KEY");

// Token lifetime: short enough that a leaked token has limited blast radius,
// long enough that a single video can play through without mid-play refresh.
const TOKEN_TTL_SECONDS = 60 * 60 * 2; // 2 hours

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, jwt: null as string | null };
  return { user: data.user, jwt: token };
}

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// RLS-enforced client bound to the caller's JWT. Used so post visibility
// policies apply when we look up a post by playback_id.
function userClient(jwt: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function userCanAccess(playbackId: string, userId: string, userJwt: string): Promise<boolean> {
  // Path 1: the user owns the upload (covers playback during/just-after upload,
  // before a post row is created).
  const ownedRes = await serviceClient()
    .from("mux_uploads")
    .select("upload_id")
    .eq("playback_id", playbackId)
    .eq("user_id", userId)
    .maybeSingle();
  if (ownedRes.data) return true;

  // Path 2: the playback_id is on a post the caller can read via RLS.
  const postRes = await userClient(userJwt)
    .from("posts")
    .select("id")
    .eq("video_playback_id", playbackId)
    .limit(1)
    .maybeSingle();
  return !!postRes.data;
}

// Decode the env-stored signing key. Mux dashboard provides a base64-encoded
// PKCS8 PEM; some setups paste the raw PEM. Handle both.
function decodePem(raw: string): string {
  if (raw.includes("BEGIN PRIVATE KEY")) return raw;
  try {
    return atob(raw);
  } catch {
    return raw;
  }
}

async function signPlaybackJwt(playbackId: string): Promise<string> {
  if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_PRIVATE_KEY) {
    throw new Error("MUX_SIGNING_KEY_ID / MUX_SIGNING_PRIVATE_KEY not configured");
  }
  const pem = decodePem(MUX_SIGNING_PRIVATE_KEY);
  const key = await importPKCS8(pem, "RS256");

  return new SignJWT({ sub: playbackId, aud: "v" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: MUX_SIGNING_KEY_ID })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(key);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if (!auth || !auth.user || !auth.jwt) return json({ error: "Unauthorized" }, 401);

  try {
    const { playback_id } = await req.json();
    if (!playback_id || typeof playback_id !== "string") {
      return json({ error: "playback_id required" }, 400);
    }

    const allowed = await userCanAccess(playback_id, auth.user.id, auth.jwt);
    if (!allowed) return json({ error: "Not found" }, 404);

    const token = await signPlaybackJwt(playback_id);
    return json({ token, expires_in: TOKEN_TTL_SECONDS });
  } catch (error) {
    console.error("[mux-playback-token] error:", (error as Error).message);
    return json({ error: "Token issue failed" }, 500);
  }
});
