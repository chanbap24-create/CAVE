import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID")!;
const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    // Create a direct upload URL
    const response = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        new_asset_settings: {
          playback_policy: ["public"],
          max_resolution_tier: "1080p",
        },
        cors_origin: "*",
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      upload_url: data.data.url,
      upload_id: data.data.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
