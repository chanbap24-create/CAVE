import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePreflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/supabase.ts";
import {
  MUX_CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MINUTES,
  isUploadRateLimited,
  muxBasicAuthHeader,
} from "../_shared/mux.ts";

serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  if (await isUploadRateLimited(auth.user.id)) {
    return json(
      { error: "Rate limit exceeded", retry_after_minutes: RATE_LIMIT_WINDOW_MINUTES },
      429,
    );
  }

  try {
    const response = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: muxBasicAuthHeader(),
      },
      body: JSON.stringify({
        new_asset_settings: {
          // New uploads require a playback JWT from mux-playback-token.
          // Existing `public` uploads keep working since Mux ignores tokens
          // on public playback ids.
          playback_policy: ["signed"],
          max_resolution_tier: "1080p",
        },
        cors_origin: MUX_CORS_ORIGIN,
      }),
    });

    const data = await response.json();
    if (!data?.data?.url || !data?.data?.id) {
      console.error("[mux-upload] unexpected Mux response:", JSON.stringify(data));
      return json({ error: "Upload provisioning failed" }, 502);
    }

    const upload_url = data.data.url as string;
    const upload_id = data.data.id as string;

    const { error: insertError } = await serviceClient()
      .from("mux_uploads")
      .insert({ upload_id, user_id: auth.user.id });

    if (insertError) {
      console.error("[mux-upload] ownership record failed:", insertError.message);
      return json({ error: "Upload provisioning failed" }, 500);
    }

    return json({ upload_url, upload_id });
  } catch (error) {
    console.error("[mux-upload] error:", (error as Error).message);
    return json({ error: "Upload provisioning failed" }, 500);
  }
});
