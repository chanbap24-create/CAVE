import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID")!;
const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  if (error || !data?.user) return null;
  return data.user;
}

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const user = await requireUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const { upload_id } = await req.json();
    if (!upload_id || typeof upload_id !== "string") {
      return json({ error: "upload_id required" }, 400);
    }

    // Verify the requester actually created this upload.
    const { data: owned, error: ownerError } = await serviceClient()
      .from("mux_uploads")
      .select("upload_id")
      .eq("upload_id", upload_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ownerError) {
      console.error("[mux-status] ownership lookup failed:", ownerError.message);
      return json({ error: "Lookup failed" }, 500);
    }
    if (!owned) return json({ error: "Not found" }, 404);

    const auth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    const response = await fetch(`https://api.mux.com/video/v1/uploads/${upload_id}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    const data = await response.json();
    const upload = data?.data;

    let playback_id: string | null = null;
    const asset_id: string | null = upload?.asset_id ?? null;

    if (asset_id) {
      const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${asset_id}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const assetData = await assetRes.json();
      playback_id = assetData?.data?.playback_ids?.[0]?.id ?? null;

      // Persist the resolved asset/playback ids so mux-playback-token can
      // confirm ownership by playback_id on the playback path.
      if (playback_id) {
        await serviceClient()
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
