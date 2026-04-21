import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Write operations against gathering_approvals + gathering_approval_votes.
 * Split from useGatheringApprovals so the read/query hook stays focused on
 * shaping the pending-approvals list. Downstream notifications are
 * DB-trigger produced (migration 00035).
 */
export function useGatheringApprovalActions(
  gatheringId: number,
  afterChange: () => Promise<void> | void,
) {
  const { user } = useAuth();

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
      // Partial-unique index blocks a second pending change request against
      // the same contribution. Recognize by SQLSTATE (23505 unique_violation)
      // rather than message so future wording tweaks don't regress us.
      const pgCode = (error as { code?: string }).code;
      if (pgCode === '23505') {
        Alert.alert('', '이전 요청이 진행중입니다.');
      } else {
        Alert.alert('Error', error.message);
      }
      return false;
    }

    // Auto-cast the requester's own approve vote so solo rooms resolve
    // instantly once the host approves. Failure is non-fatal — the voting
    // UI can still collect it manually.
    if (approval?.id) {
      await supabase.from('gathering_approval_votes').insert({
        approval_id: approval.id,
        voter_id: user.id,
        vote: 'approve',
      });
    }

    await afterChange();
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
      const pgCode = (error as { code?: string }).code;
      // 23505 = duplicate vote, treat as a no-op; anything else surfaces.
      if (pgCode !== '23505') {
        Alert.alert('Error', error.message);
        return false;
      }
    }

    await afterChange();
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
    await afterChange();
    return true;
  }

  return { requestWineChange, castVote, cancelRequest };
}
