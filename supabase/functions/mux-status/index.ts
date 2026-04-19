import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePreflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { muxBasicAuthHeader } from "../_shared/mux.ts";

serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  try {
    const { upload_id } = await req.json();
    if (!upload_id || typeof upload_id !== "string") {
      return json({ error: "upload_id required" }, 400);
    }

    const db = serviceClient();

    const { data: owned, error: ownerError } = await db
      .from("mux_uploads")
      .select("upload_id")
      .eq("upload_id", upload_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (ownerError) {
      console.error("[mux-status] ownership lookup failed:", ownerError.message);
      return json({ error: "Lookup failed" }, 500);
    }
    if (!owned) return json({ error: "Not found" }, 404);

    const authHeader = muxBasicAuthHeader();

    const response = await fetch(`https://api.mux.com/video/v1/uploads/${upload_id}`, {
      headers: { Authorization: authHeader },
    });

    const data = await response.json();
    const upload = data?.data;

    let playback_id: string | null = null;
    const asset_id: string | null = upload?.asset_id ?? null;

    if (asset_id) {
      const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${asset_id}`, {
        headers: { Authorization: authHeader },
      });
      const assetData = await assetRes.json();
      playback_id = assetData?.data?.playback_ids?.[0]?.id ?? null;

      // Persist resolved ids so mux-playback-token can match by playback_id.
      if (playback_id) {
        await db
          .from("mux_uploads")
          .update({ asset_id, playback_id })
          .eq("upload_id", upload_id);
      }
    }

    return json({
      status: upload?.status,
      asset_id,
      playback_id,
    });
  } catch (error) {
    console.error("[mux-status] error:", (error as Error).message);
    return json({ error: "Status check failed" }, 500);
  }
});
