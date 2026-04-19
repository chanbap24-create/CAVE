import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

// Refresh a little before server expiry to avoid mid-play 401s.
const REFRESH_SAFETY_SECONDS = 60;

interface CacheEntry {
  token: string;
  expiresAt: number; // epoch ms
}

// Shared across all VideoPlayer instances — a feed with many videos of the
// same playback_id only hits the edge function once per token lifetime.
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

async function fetchToken(playbackId: string): Promise<string | null> {
  const existing = inflight.get(playbackId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mux-playback-token`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ playback_id: playbackId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.token || typeof data.expires_in !== 'number') return null;
      const expiresAt = Date.now() + (data.expires_in - REFRESH_SAFETY_SECONDS) * 1000;
      cache.set(playbackId, { token: data.token, expiresAt });
      return data.token as string;
    } catch {
      return null;
    } finally {
      inflight.delete(playbackId);
    }
  })();

  inflight.set(playbackId, promise);
  return promise;
}

/**
 * Returns a Mux signed playback token for the given playback_id.
 *
 * For old public-policy uploads the server still issues a token which Mux
 * safely ignores; for new signed-policy uploads the token is required.
 * If issuance fails (secrets not configured, auth expired, etc.) returns null
 * and callers should fall back to the unsigned playback URL — old videos keep
 * playing, new videos will 403 until the operator configures the signing key.
 */
export function useMuxPlaybackToken(playbackId: string | null | undefined) {
  const [token, setToken] = useState<string | null>(() => {
    if (!playbackId) return null;
    const hit = cache.get(playbackId);
    return hit && hit.expiresAt > Date.now() ? hit.token : null;
  });
  const [loading, setLoading] = useState<boolean>(!token && !!playbackId);

  useEffect(() => {
    if (!playbackId) {
      setToken(null);
      setLoading(false);
      return;
    }
    const hit = cache.get(playbackId);
    if (hit && hit.expiresAt > Date.now()) {
      setToken(hit.token);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    fetchToken(playbackId).then(t => {
      if (!mounted) return;
      setToken(t);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [playbackId]);

  return { token, loading };
}
