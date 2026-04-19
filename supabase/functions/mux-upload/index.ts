import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID")!;
const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MUX_CORS_ORIGIN = Deno.env.get("MUX_CORS_ORIGIN") ?? "*";

// Rate limit: max uploads per user per rolling window.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MINUTES = 60;

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

// Check if user has exceeded the upload rate limit.
// Returns true when over the threshold (request should be rejected).
async function isRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await serviceClient()
    .from("mux_uploads")
    .select("upload_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    // Fail-open: on DB error, don't block uploads (logs error for visibility).
    console.error("[mux-upload] rate limit check failed:", error.message);
    return false;
  }
  return (count ?? 0) >= RATE_LIMIT_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const user = await requireUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);

  if (await isRateLimited(user.id)) {
    return json(
      { error: "Rate limit exceeded", retry_after_minutes: RATE_LIMIT_WINDOW_MINUTES },
      429,
    );
  }

  try {
    const auth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    const response = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        new_asset_settings: {
          // `signed` requires clients to fetch a playback JWT from mux-playback-token
          // before streaming. Old uploads with `public` policy continue to work since
          // their playback_ids were issued public and stay that way.
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

    // Record ownership for mux-status verification and future rate-limit queries.
    const { error: insertError } = await serviceClient()
      .from("mux_uploads")
      .insert({ upload_id, user_id: user.id });

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
