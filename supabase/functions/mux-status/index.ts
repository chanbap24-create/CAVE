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
    const { upload_id } = await req.json();
    const auth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    // Get upload status
    const response = await fetch(`https://api.mux.com/video/v1/uploads/${upload_id}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    const data = await response.json();
    const upload = data.data;

    let playback_id = null;
    let asset_id = upload.asset_id;

    // If asset exists, get playback ID
    if (asset_id) {
      const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${asset_id}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const assetData = await assetRes.json();
      playback_id = assetData.data?.playback_ids?.[0]?.id || null;
    }

    return new Response(JSON.stringify({
      status: upload.status,
      asset_id,
      playback_id,
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
