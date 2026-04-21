import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useGatheringMutations } from '@/lib/hooks/useGatheringMutations';

export interface MemberContribution {
  id: number;
  collection_id: number | null;
  is_blind: boolean;
  status: string;
  wine?: {
    name: string;
    name_ko: string | null;
    producer: string | null;
    category: string | null;
    region: string | null;
    country: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  collection_photo_url?: string | null;
}

export interface GatheringMember {
  user_id: string;
  status: string;
  message: string | null;
  responded_at: string | null;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    collection_count: number;
  };
  contribution?: MemberContribution | null;
}

/** Same shape as MemberContribution, plus the contributor's identity so the
 *  lineup can render "who brought what" even for host-prepared slots. */
export interface LineupEntry extends MemberContribution {
  user_id: string;
  is_host: boolean;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Maps a raw contribution row (with joined collection/wine) into the shared
// MemberContribution shape. Kept in-file to stay close to the consumer type.
function shapeContribution(row: any): MemberContribution {
  const col = row.collection as any;
  return {
    id: row.id,
    collection_id: row.collection_id,
    is_blind: row.is_blind,
    status: row.status,
    wine: col?.wine
      ? {
          name: col.wine.name,
          name_ko: col.wine.name_ko ?? null,
          producer: col.wine.producer ?? null,
          category: col.wine.category ?? null,
          region: col.wine.region ?? null,
          country: col.wine.country ?? null,
          vintage_year: col.wine.vintage_year,
          image_url: col.wine.image_url,
        }
      : null,
    collection_photo_url: col?.photo_url ?? null,
  };
}

export function useGatheringDetail(gatheringId: number) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GatheringMember[]>([]);
  const [lineup, setLineup] = useState<LineupEntry[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);

    const [{ data }, { data: gatheringRow }] = await Promise.all([
      supabase
        .from('gathering_members')
        .select('*')
        .eq('gathering_id', gatheringId),
      supabase
        .from('gatherings')
        .select('host_id')
        .eq('id', gatheringId)
        .single(),
    ]);

    if (!data) { setLoading(false); return; }

    const hostId = gatheringRow?.host_id ?? null;
    const userIds = data.map(m => m.user_id);

    // Batched. Profiles include the host so host slots in the lineup show
    // identity even when the host isn't in gathering_members.
    const allIds = Array.from(new Set([...userIds, ...(hostId ? [hostId] : [])]));
    const [{ data: profiles }, { data: contribs }] = await Promise.all([
      allIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, collection_count')
            .in('id', allIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase
        .from('gathering_contributions')
        .select(`
          id, user_id, collection_id, is_blind, status, slot_order,
          collection:collections(photo_url, wine:wines(name, name_ko, producer, category, region, country, vintage_year, image_url))
        `)
        .eq('gathering_id', gatheringId)
        .neq('status', 'canceled')
        .order('slot_order', { ascending: true }),
    ]);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Per-user active contribution: prefer 'committed' over 'pending' when
    // both exist mid-transition.
    const contribMap = new Map<string, MemberContribution>();
    for (const row of (contribs ?? []) as any[]) {
      const existing = contribMap.get(row.user_id);
      const isBetter = !existing
        || (existing.status === 'pending' && row.status === 'committed');
      if (isBetter) contribMap.set(row.user_id, shapeContribution(row));
    }

    const enriched = data.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id),
      contribution: contribMap.get(m.user_id) ?? null,
    }));
    setMembers(enriched);

    // Wine Lineup: every committed contribution, host first. DB already
    // ordered by slot_order so the within-host / within-guest order holds.
    const committed: LineupEntry[] = [];
    for (const row of (contribs ?? []) as any[]) {
      if (row.status !== 'committed') continue;
      committed.push({
        ...shapeContribution(row),
        user_id: row.user_id,
        is_host: row.user_id === hostId,
        profile: profileMap.get(row.user_id),
      });
    }
    committed.sort((a, b) => (a.is_host === b.is_host ? 0 : a.is_host ? -1 : 1));
    setLineup(committed);

    if (user) {
      const mine = data.find(m => m.user_id === user.id);
      setMyStatus(mine?.status || null);
    }

    setLoading(false);
  }, [gatheringId, user]);

  // Mutations are split into their own hook; we bind loadMembers so any
  // write triggers a refetch. Pass-through also keeps the public API of
  // useGatheringDetail unchanged for existing callers.
  const mutations = useGatheringMutations(gatheringId, async () => {
    await loadMembers();
  });

  async function applyToJoinAndSetStatus(message: string, collectionId: number | null, gatheringType: string) {
    const ok = await mutations.applyToJoin(message, collectionId, gatheringType);
    if (ok) setMyStatus('pending');
    return ok;
  }
  async function leaveAndClear() {
    await mutations.leaveGathering();
    setMyStatus(null);
  }

  return {
    members, lineup, myStatus, loading,
    loadMembers,
    applyToJoin: applyToJoinAndSetStatus,
    respondToApplicant: mutations.respondToApplicant,
    leaveGathering: leaveAndClear,
    revealBlindSlot: mutations.revealBlindSlot,
  };
}
