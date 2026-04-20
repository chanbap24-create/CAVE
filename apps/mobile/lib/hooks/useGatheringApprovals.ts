import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

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
 * Approval request + vote orchestration for wine-change and no-wine-apply
 * flows. Reads piggy-back on the DB trigger `apply_unanimous_approval` —
 * this hook only writes votes/requests and re-fetches.
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
      { count: approvedCount },
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
      supabase
        .from('gathering_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('gathering_id', gatheringId)
        .eq('status', 'approved'),
    ]);

    if (!rawApprovals) {
      setApprovals([]);
      setLoading(false);
      return;
    }

    // Eligible voters = host + currently approved members.
    const eligible = 1 + (approvedCount ?? 0);

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

  async function requestWineChange(
    contributionId: number,
    newCollectionId: number,
    note?: string,
  ): Promise<boolean> {
    if (!user) return false;

    const { data: approval, error } = await supabase
      .from('gathering_approvals')
      .insert({
        gathering_id: gatheringId,
        requester_id: user.id,
        request_type: 'wine_change',
        target_contribution_id: contributionId,
        new_collection_id: newCollectionId,
        note: note?.trim() || null,
      })
      .select('id')
      .single();

    if (error) {
      // Partial-unique index rejects a second pending request per contribution.
      const msg = error.message.toLowerCase();
      if (msg.includes('gathering_approvals_one_pending_per_contribution')) {
        Alert.alert('', '이전 요청이 진행중입니다.');
      } else {
        Alert.alert('Error', error.message);
      }
      return false;
    }

    // Auto-cast the requester's own approve vote — their stance is implicit
    // in making the request. Without this they'd have to tap their own row
    // to approve, which feels redundant. If this fails, skip silently — the
    // voting UI can still collect it manually.
    if (approval?.id) {
      await supabase.from('gathering_approval_votes').insert({
        approval_id: approval.id,
        voter_id: user.id,
        vote: 'approve',
      });
    }

    // Notify host + approved members so they know a vote is needed.
    const [{ data: gathering }, { data: approvedMembers }] = await Promise.all([
      supabase.from('gatherings').select('host_id, title').eq('id', gatheringId).single(),
      supabase
        .from('gathering_members')
        .select('user_id')
        .eq('gathering_id', gatheringId)
        .eq('status', 'approved'),
    ]);

    if (gathering) {
      const voterIds = new Set<string>([gathering.host_id]);
      for (const m of approvedMembers ?? []) voterIds.add(m.user_id);
      voterIds.delete(user.id); // don't notify yourself

      const notifRows = Array.from(voterIds).map(uid => ({
        user_id: uid,
        type: 'gathering_vote_request',
        actor_id: user.id,
        reference_id: gatheringId.toString(),
        reference_type: 'gathering',
        body: `requested a wine change in "${gathering.title}"`,
      }));
      if (notifRows.length > 0) {
        await supabase.from('notifications').insert(notifRows);
      }
    }

    await load();
    return true;
  }

  async function castVote(approvalId: number, vote: 'approve' | 'reject'): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase.from('gathering_approval_votes').insert({
      approval_id: approvalId,
      voter_id: user.id,
      vote,
    });
    if (error) {
      // Duplicate votes (composite PK) silently ignored on UI level.
      if (!error.message.toLowerCase().includes('duplicate key')) {
        Alert.alert('Error', error.message);
        return false;
      }
    }

    // Notify the requester. The DB trigger already applied the outcome
    // atomically — read the post-trigger status to pick the right notif
    // type. Skip if I'm voting on my own request (auto-cast on create).
    const { data: approval } = await supabase
      .from('gathering_approvals')
      .select('requester_id, status, gathering_id, gathering:gatherings(title)')
      .eq('id', approvalId)
      .single();

    if (approval && approval.requester_id !== user.id) {
      const title = (approval.gathering as any)?.title ?? '모임';
      let notifType: string;
      let body: string;
      if (approval.status === 'approved') {
        notifType = 'gathering_vote_approved';
        body = `Your wine-change request in "${title}" was approved`;
      } else if (approval.status === 'rejected') {
        notifType = 'gathering_vote_rejected';
        body = `Your wine-change request in "${title}" was rejected`;
      } else {
        notifType = 'gathering_vote_cast';
        body = vote === 'approve'
          ? `approved your wine-change request in "${title}"`
          : `voted against your wine-change request in "${title}"`;
      }
      await supabase.from('notifications').insert({
        user_id: approval.requester_id,
        type: notifType,
        actor_id: user.id,
        reference_id: approval.gathering_id.toString(),
        reference_type: 'gathering',
        body,
      });
    }

    await load();
    return true;
  }

  async function cancelRequest(approvalId: number): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from('gathering_approvals')
      .update({ status: 'canceled', resolved_at: new Date().toISOString() })
      .eq('id', approvalId)
      .eq('requester_id', user.id)
      .eq('status', 'pending');
    if (error) {
      Alert.alert('Error', error.message);
      return false;
    }
    await load();
    return true;
  }

  return { approvals, loading, load, requestWineChange, castVote, cancelRequest };
}
