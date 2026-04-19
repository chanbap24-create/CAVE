// Issues a short-lived Mux signed-playback JWT for a playback_id the caller
// has access to. Usage: https://stream.mux.com/{playback_id}.m3u8?token={jwt}
//
// Access check (cheapest path first):
//   1. The user uploaded this playback_id (mux_uploads.user_id).
//   2. OR the playback_id is on a posts row visible to the caller via RLS.
//
// Mux docs: https://docs.mux.com/guides/secure-video-playback
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.9.6";
import { handlePreflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { serviceClient, userClient } from "../_shared/supabase.ts";
import {
  MUX_SIGNING_KEY_ID,
  MUX_SIGNING_PRIVATE_KEY,
  PLAYBACK_TOKEN_TTL_SECONDS,
  decodeSigningPem,
} from "../_shared/mux.ts";

async function userCanAccess(
  playbackId: string,
  userId: string,
  userJwt: string,
): Promise<boolean> {
  // Path 1: caller owns the upload (covers playback immediately after upload,
  // before the post row is created).
  const ownedRes = await serviceClient()
    .from("mux_uploads")
    .select("upload_id")
    .eq("playback_id", playbackId)
    .eq("user_id", userId)
    .maybeSingle();
  if (ownedRes.data) return true;

  // Path 2: playback_id is on a post the caller can read via RLS.
  const postRes = await userClient(userJwt)
    .from("posts")
    .select("id")
    .eq("video_playback_id", playbackId)
    .limit(1)
    .maybeSingle();
  return !!postRes.data;
}

async function signPlaybackJwt(playbackId: string): Promise<string> {
  if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_PRIVATE_KEY) {
    throw new Error("MUX_SIGNING_KEY_ID / MUX_SIGNING_PRIVATE_KEY not configured");
  }
  const pem = decodeSigningPem(MUX_SIGNING_PRIVATE_KEY);
  const key = await importPKCS8(pem, "RS256");

  return new SignJWT({ sub: playbackId, aud: "v" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: MUX_SIGNING_KEY_ID })
    .setIssuedAt()
    .setExpirationTime(`${PLAYBACK_TOKEN_TTL_SECONDS}s`)
    .sign(key);
}

serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  try {
    const { playback_id } = await req.json();
    if (!playback_id || typeof playback_id !== "string") {
      return json({ error: "playback_id required" }, 400);
    }

    const allowed = await userCanAccess(playback_id, auth.user.id, auth.jwt);
    if (!allowed) return json({ error: "Not found" }, 404);

    const token = await signPlaybackJwt(playback_id);
    return json({ token, expires_in: PLAYBACK_TOKEN_TTL_SECONDS });
  } catch (error) {
    console.error("[mux-playback-token] error:", (error as Error).message);
    return json({ error: "Token issue failed" }, 500);
  }
});
