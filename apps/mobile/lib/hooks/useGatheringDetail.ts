import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';

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

    // Batched. Profiles include the host even if they're not a "member" —
    // we need the host's identity to render their slots in the lineup.
    const allIds = Array.from(new Set([...userIds, ...(hostId ? [hostId] : [])]));
    const [{ data: profiles }, { data: contribs }] = await Promise.all([
      allIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, collection_count')
            .in('id', allIds)
        : Promise.resolve({ data: [] as any[] }),
      // All non-canceled contributions for this gathering — both host and
      // attendees. We'll split pending vs committed below.
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

    // Prefer 'committed' over 'pending' for the member's displayed wine.
    // A member should only have one active contribution at a time anyway,
    // but if both exist (mid-transition) the committed one is the source
    // of truth.
    const contribMap = new Map<string, MemberContribution>();
    for (const c of (contribs ?? []) as any[]) {
      const existing = contribMap.get(c.user_id);
      const isBetter = !existing
        || (existing.status === 'pending' && c.status === 'committed');
      if (!isBetter) continue;
      const col = c.collection as any;
      contribMap.set(c.user_id, {
        id: c.id,
        collection_id: c.collection_id,
        is_blind: c.is_blind,
        status: c.status,
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
      });
    }

    const enriched = data.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id),
      contribution: contribMap.get(m.user_id) ?? null,
    }));

    setMembers(enriched);

    // Lineup = every committed contribution, host first then attendees in
    // slot_order. Used by the detail page's "Wine Lineup" section.
    const committed: LineupEntry[] = [];
    for (const c of (contribs ?? []) as any[]) {
      if (c.status !== 'committed') continue;
      const col = c.collection as any;
      committed.push({
        id: c.id,
        user_id: c.user_id,
        is_host: c.user_id === hostId,
        collection_id: c.collection_id,
        is_blind: c.is_blind,
        status: c.status,
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
        profile: profileMap.get(c.user_id),
      });
    }
    // Stable order: host slots first, then attendees, preserving slot_order
    // within each group (the DB query already sorted by slot_order asc).
    committed.sort((a, b) => {
      if (a.is_host !== b.is_host) return a.is_host ? -1 : 1;
      return 0;
    });
    setLineup(committed);

    if (user) {
      const mine = data.find(m => m.user_id === user.id);
      setMyStatus(mine?.status || null);
    }

    setLoading(false);
  }, [gatheringId, user]);

  /**
   * Apply to join. `collectionId` may be null for cost_share/donation rooms
   * (no-wine apply path — will require a unanimous vote in Phase 6).
   * For byob the caller must pass a non-null id; we defensively double-check.
   */
  async function applyToJoin(
    message: string,
    collectionId: number | null,
    gatheringType: string,
  ) {
    if (!user) return false;

    if (gatheringType === 'byob' && collectionId == null) {
      Alert.alert('', 'BYOB 모임은 가져갈 와인을 선택해야 합니다');
      return false;
    }

    const { error } = await supabase.from('gathering_members').insert({
      gathering_id: gatheringId,
      user_id: user.id,
      status: 'pending',
      message: message.trim() || null,
    });

    if (error) {
      Alert.alert('Error', error.message);
      return false;
    }

    // Insert a pending contribution if a wine was picked. Not a fatal error
    // if this fails — the membership row is already in. Surface so the user
    // can retry from the detail screen later.
    if (collectionId != null) {
      const { error: contribError } = await supabase
        .from('gathering_contributions')
        .insert({
          gathering_id: gatheringId,
          user_id: user.id,
          collection_id: collectionId,
          is_blind: false,
          slot_order: 0,
          status: 'pending',
        });
      if (contribError) {
        console.error('[applyToJoin] contribution insert failed:', contribError.message);
        Alert.alert('주의', '신청은 완료했으나 와인 정보 저장에 실패했습니다. 상세 페이지에서 다시 시도해주세요.');
      }
    }

    // Notify host
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('host_id, title')
      .eq('id', gatheringId)
      .single();

    if (gathering && gathering.host_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: gathering.host_id,
        type: 'gathering_invite',
        actor_id: user.id,
        reference_id: gatheringId.toString(),
        reference_type: 'gathering',
        body: `wants to join "${gathering.title}"`,
      });
    }

    setMyStatus('pending');
    await loadMembers();
    return true;
  }

  async function respondToApplicant(applicantUserId: string, approve: boolean) {
    if (!user) return;

    const newStatus = approve ? 'approved' : 'rejected';
    await supabase
      .from('gathering_members')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('gathering_id', gatheringId)
      .eq('user_id', applicantUserId);

    // Sync the contribution: on approve → committed, on reject → canceled.
    // We target only that user's pending row; host slots are always
    // committed from day one so they're untouched.
    await supabase
      .from('gathering_contributions')
      .update({ status: approve ? 'committed' : 'canceled' })
      .eq('gathering_id', gatheringId)
      .eq('user_id', applicantUserId)
      .eq('status', 'pending');

    // Notify applicant
    const notifType = approve ? 'gathering_approved' : 'gathering_rejected';
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('title')
      .eq('id', gatheringId)
      .single();

    await supabase.from('notifications').insert({
      user_id: applicantUserId,
      type: notifType,
      actor_id: user.id,
      reference_id: gatheringId.toString(),
      reference_type: 'gathering',
      body: approve
        ? `approved your request to join "${gathering?.title}"`
        : `declined your request to join "${gathering?.title}"`,
    });

    await loadMembers();
  }

  async function leaveGathering() {
    if (!user) return;
    // Cancel any pending/committed contribution first (unique-index on
    // (gathering_id, collection_id) would block re-applying later otherwise).
    await supabase
      .from('gathering_contributions')
      .delete()
      .eq('gathering_id', gatheringId)
      .eq('user_id', user.id);
    await supabase
      .from('gathering_members')
      .delete()
      .eq('gathering_id', gatheringId)
      .eq('user_id', user.id);
    setMyStatus(null);
    await loadMembers();
  }

  return { members, lineup, myStatus, loading, loadMembers, applyToJoin, respondToApplicant, leaveGathering };
}
