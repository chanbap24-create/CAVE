// Extracts structured wine-label data from a base64 image using Claude Vision.
// The user supplies { image_base64, media_type }; we auth, rate-limit, call
// Anthropic, parse the JSON response, and return ExtractedWineInfo to the
// client. Each call is logged to vision_calls for audit + rate-limit counting.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePreflight, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/supabase.ts";
import {
  VISION_RATE_LIMIT_WINDOW_MINUTES,
  WINE_VISION_MAX_TOKENS,
  WINE_VISION_MODEL,
  WINE_VISION_SYSTEM_PROMPT,
  WINE_VISION_USER_PROMPT,
  anthropicClient,
  isVisionRateLimited,
} from "../_shared/anthropic.ts";

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
// 5 MB base64 ≈ 3.75 MB raw. Anthropic accepts larger but mobile-originated
// label crops don't need more and bigger payloads blow Edge Function limits.
const MAX_BASE64_BYTES = 5 * 1024 * 1024;

interface VisionBody {
  image_base64?: string;
  media_type?: string;
}

function parseExtractedJson(text: string): Record<string, unknown> | null {
  // Model is instructed to return pure JSON, but strip stray fences defensively.
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const auth = await requireUser(req);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  if (await isVisionRateLimited(auth.user.id)) {
    return json(
      { error: "Rate limit exceeded", retry_after_minutes: VISION_RATE_LIMIT_WINDOW_MINUTES },
      429,
    );
  }

  let body: VisionBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { image_base64, media_type } = body;
  if (!image_base64 || typeof image_base64 !== "string") {
    return json({ error: "image_base64 required" }, 400);
  }
  if (!media_type || !ALLOWED_MEDIA.has(media_type)) {
    return json({ error: "media_type must be image/jpeg, image/png, image/webp, or image/gif" }, 400);
  }
  if (image_base64.length > MAX_BASE64_BYTES) {
    return json({ error: "Image too large" }, 413);
  }

  // Attempt counter — record the call regardless of downstream outcome so a
  // caller can't dodge the rate limiter by crafting payloads that make the
  // Anthropic request fail. Success path will update confidence/tokens.
  const callRecord = {
    user_id: auth.user.id,
    model: WINE_VISION_MODEL,
    confidence: null as number | null,
    input_tokens: null as number | null,
    output_tokens: null as number | null,
  };

  try {
    const response = await anthropicClient().messages.create({
      model: WINE_VISION_MODEL,
      max_tokens: WINE_VISION_MAX_TOKENS,
      system: [
        {
          type: "text",
          text: WINE_VISION_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: media_type as "image/jpeg", data: image_base64 },
            },
            { type: "text", text: WINE_VISION_USER_PROMPT },
          ],
        },
      ],
    });

    callRecord.input_tokens = response.usage?.input_tokens ?? null;
    callRecord.output_tokens = response.usage?.output_tokens ?? null;

    const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;
    if (!textBlock) {
      console.error("[wine-vision] no text block in response");
      await serviceClient().from("vision_calls").insert(callRecord);
      return json({ error: "Vision extraction failed" }, 502);
    }

    const extracted = parseExtractedJson(textBlock.text);
    if (!extracted) {
      console.error("[wine-vision] JSON parse failed. Raw:", textBlock.text.slice(0, 500));
      await serviceClient().from("vision_calls").insert(callRecord);
      return json({ error: "Vision extraction malformed" }, 502);
    }

    callRecord.confidence = typeof extracted.confidence === "number" ? extracted.confidence : null;
    await serviceClient().from("vision_calls").insert(callRecord);
    return json(extracted);
  } catch (error) {
    console.error("[wine-vision] error:", (error as Error).message);
    // Still record the attempt so the rate-limiter can't be bypassed by
    // crafting an Anthropic request that throws before the success path.
    await serviceClient().from("vision_calls").insert(callRecord).throwOnError().catch(() => {});
    return json({ error: "Vision extraction failed" }, 500);
  }
});
