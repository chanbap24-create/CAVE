import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useGatheringApprovalActions } from '@/lib/hooks/useGatheringApprovalActions';

export interface ApprovalWine {
  name: string | null;
  name_ko: string | null;
  producer: string | null;
  vintage_year: number | null;
  image_url: string | null;
  photo_url: string | null;
}

export interface ApprovalVoteRow {
  voter_id: string;
  vote: 'approve' | 'reject';
  username?: string | null;
}

export interface ApprovalWithDetails {
  id: number;
  gathering_id: number;
  requester_id: string;
  request_type: 'wine_change' | 'no_wine_apply';
  target_contribution_id: number | null;
  new_collection_id: number | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  created_at: string;
  requester_username: string | null;
  /** Wine the contribution currently points at (before the swap). */
  current_wine: ApprovalWine | null;
  /** Wine being proposed. */
  proposed_wine: ApprovalWine | null;
  votes: ApprovalVoteRow[];
  /** Count of eligible voters at fetch time (host + approved members). */
  eligible_count: number;
}

/**
 * Read-side of gathering approval flow: fetches pending wine_change /
 * no_wine_apply requests with joined wine + vote info, and exposes write
 * operations (request/vote/cancel) through the companion actions hook.
 * Reads piggy-back on the `apply_unanimous_approval` DB trigger (migration
 * 00029), which resolves status atomically before this hook refetches.
 */
export function useGatheringApprovals(gatheringId: number) {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const [
      { data: rawApprovals },
      { data: hostRow },
      { data: approvedRows },
    ] = await Promise.all([
      supabase
        .from('gathering_approvals')
        .select(`
          id, gathering_id, requester_id, request_type,
          target_contribution_id, new_collection_id, note, status, created_at,
          requester:profiles!gathering_approvals_requester_id_fkey(username),
          target:gathering_contributions!gathering_approvals_target_contribution_id_fkey(
            collection_id,
            collection:collections(photo_url, wine:wines(name, name_ko, producer, vintage_year, image_url))
          ),
          proposed:collections!gathering_approvals_new_collection_id_fkey(
            photo_url, wine:wines(name, name_ko, producer, vintage_year, image_url)
          )
        `)
        .eq('gathering_id', gatheringId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('gatherings')
        .select('host_id')
        .eq('id', gatheringId)
        .single(),
      // 승인된 멤버의 user_id 만 가져와 host 제외 후 unique count.
      // 호스트가 (실수/legacy 데이터로) 자기 모임에 'approved' 멤버로 들어가
      // 있으면 +1 + 1 = 2 로 이중 카운트되는 회귀 회피.
      supabase
        .from('gathering_members')
        .select('user_id')
        .eq('gathering_id', gatheringId)
        .eq('status', 'approved'),
    ]);

    if (!rawApprovals) {
      setApprovals([]);
      setLoading(false);
      return;
    }

    // Eligible voters = host + currently approved members (host 중복 제외, 신청자 자동 제외).
    const hostId = hostRow?.host_id;
    const approvedNonHost = (approvedRows || []).filter(r => r.user_id !== hostId);
    const eligible = 1 + approvedNonHost.length;

    const approvalIds = rawApprovals.map(a => a.id);
    let voteMap = new Map<number, ApprovalVoteRow[]>();
    if (approvalIds.length > 0) {
      const { data: votes } = await supabase
        .from('gathering_approval_votes')
        .select('approval_id, voter_id, vote, voter:profiles!gathering_approval_votes_voter_id_fkey(username)')
        .in('approval_id', approvalIds);
      for (const v of (votes ?? []) as any[]) {
        const list = voteMap.get(v.approval_id) ?? [];
        list.push({
          voter_id: v.voter_id,
          vote: v.vote,
          username: v.voter?.username ?? null,
        });
        voteMap.set(v.approval_id, list);
      }
    }

    const shaped: ApprovalWithDetails[] = (rawApprovals as any[]).map(a => {
      const currentCol = a.target?.collection;
      const proposedCol = a.proposed;
      return {
        id: a.id,
        gathering_id: a.gathering_id,
        requester_id: a.requester_id,
        request_type: a.request_type,
        target_contribution_id: a.target_contribution_id,
        new_collection_id: a.new_collection_id,
        note: a.note,
        status: a.status,
        created_at: a.created_at,
        requester_username: a.requester?.username ?? null,
        current_wine: currentCol?.wine
          ? {
              name: currentCol.wine.name,
              name_ko: currentCol.wine.name_ko ?? null,
              producer: currentCol.wine.producer ?? null,
              vintage_year: currentCol.wine.vintage_year ?? null,
              image_url: currentCol.wine.image_url ?? null,
              photo_url: currentCol.photo_url ?? null,
            }
          : null,
        proposed_wine: proposedCol?.wine
          ? {
              name: proposedCol.wine.name,
              name_ko: proposedCol.wine.name_ko ?? null,
              producer: proposedCol.wine.producer ?? null,
              vintage_year: proposedCol.wine.vintage_year ?? null,
              image_url: proposedCol.wine.image_url ?? null,
              photo_url: proposedCol.photo_url ?? null,
            }
          : null,
        votes: voteMap.get(a.id) ?? [],
        eligible_count: eligible,
      };
    });

    setApprovals(shaped);
    setLoading(false);
  }, [gatheringId]);

  const actions = useGatheringApprovalActions(gatheringId, async () => { await load(); });

  return {
    approvals, loading, load,
    requestWineChange: actions.requestWineChange,
    castVote: actions.castVote,
    cancelRequest: actions.cancelRequest,
  };
}
