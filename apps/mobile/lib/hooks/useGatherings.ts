import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { GatheringType } from '@/lib/types/gathering';

export interface GatheringWinePreview {
  id: number;
  is_blind: boolean;
  wine_name: string | null;
  image_url: string | null;
  photo_url: string | null;
  vintage_year: number | null;
}

export type GatheringHostType = 'user' | 'shop' | 'sommelier' | 'venue';

export interface Gathering {
  id: number;
  host_id: string;
  title: string;
  description: string | null;
  location: string | null;
  gathering_date: string | null;
  max_members: number;
  current_members: number;
  status: string;
  category: string | null;
  gathering_type: GatheringType;
  price_per_person: number | null;
  external_chat_url: string | null;
  metadata: any;
  created_at: string;
  /** 'user' = 일반 사용자 / 그 외 = 파트너 호스팅 (shop, sommelier, venue) */
  host_type: GatheringHostType;
  /** "이런 분께 추천" 인용구 — 트레바리식 픽업 카피 */
  pitch_bullets?: string[] | null;
  /** "이 모임의 약속" — 참여 규칙·준비물·매너 */
  agreement?: string | null;
  host?: {
    username: string; display_name: string | null; avatar_url: string | null;
    is_partner?: boolean | null;
    partner_label?: string | null;
  };
  // First N committed wines to render on the card (null for no-wine rooms).
  wine_previews: GatheringWinePreview[];
  // Total committed contributions (host slots + approved attendees).
  wine_total: number;
}

const CARD_PREVIEW_LIMIT = 3;

export function useGatherings(category?: string | null) {
  const { user } = useAuth();
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGatherings = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('gatherings')
      .select('*')
      .order('gathering_date', { ascending: true });
    if (category) q = q.eq('category', category);

    const { data } = await q;

    if (!data) { setLoading(false); return; }

    const hostIds = [...new Set(data.map(g => g.host_id))];
    const gatheringIds = data.map(g => g.id);

    // One round-trip for all host profiles, another for all committed
    // contributions (with wine + collection photo joined). Groups are
    // assembled client-side so the card list stays O(1) network-ops
    // regardless of how many gatherings are on screen.
    const [{ data: profiles }, { data: contribs }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, collection_count, is_partner, partner_label')
        .in('id', hostIds),
      gatheringIds.length > 0
        ? supabase
            .from('gathering_contributions')
            .select(`
              id, gathering_id, is_blind, slot_order,
              collection:collections(photo_url, wine:wines(name, image_url, vintage_year))
            `)
            .in('gathering_id', gatheringIds)
            .eq('status', 'committed')
            .order('slot_order', { ascending: true })
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const contribMap = new Map<number, GatheringWinePreview[]>();
    const countMap = new Map<number, number>();
    for (const c of (contribs ?? []) as any[]) {
      const col = c.collection as any;
      const preview: GatheringWinePreview = {
        id: c.id,
        is_blind: c.is_blind,
        wine_name: col?.wine?.name ?? null,
        image_url: col?.wine?.image_url ?? null,
        photo_url: col?.photo_url ?? null,
        vintage_year: col?.wine?.vintage_year ?? null,
      };
      const list = contribMap.get(c.gathering_id) ?? [];
      list.push(preview);
      contribMap.set(c.gathering_id, list);
      countMap.set(c.gathering_id, (countMap.get(c.gathering_id) ?? 0) + 1);
    }

    const enriched: Gathering[] = data.map(g => ({
      ...g,
      host: profileMap.get(g.host_id),
      wine_previews: (contribMap.get(g.id) ?? []).slice(0, CARD_PREVIEW_LIMIT),
      wine_total: countMap.get(g.id) ?? 0,
    }));

    setGatherings(enriched);
    setLoading(false);
  }, [category]);

  return { gatherings, loading, loadGatherings };
}
