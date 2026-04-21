import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Write operations for a single gathering: apply to join, host responses,
 * blind-slot reveal, and leaving. Extracted from useGatheringDetail so the
 * data-loading hook stays focused on queries.
 *
 * All downstream notifications are DB-trigger produced (migration 00035);
 * this hook does not insert into `notifications` directly.
 */
export function useGatheringMutations(
  gatheringId: number,
  afterChange: () => Promise<void> | void,
) {
  const { user } = useAuth();

  /**
   * Apply to join. `collectionId` may be null for cost_share/donation rooms
   * (no-wine apply path). BYOB requires a non-null id; we defensively
   * double-check and bail out with a user-facing alert.
   */
  async function applyToJoin(
    message: string,
    collectionId: number | null,
    gatheringType: string,
  ): Promise<boolean> {
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
    } else if (gatheringType !== 'byob') {
      // No-wine apply: promotion to approved member needs a unanimous
      // vote. DB trigger apply_unanimous_approval flips the member row
      // to 'approved' when everyone voted yes.
      const { data: approval, error: approvalError } = await supabase
        .from('gathering_approvals')
        .insert({
          gathering_id: gatheringId,
          requester_id: user.id,
          request_type: 'no_wine_apply',
          target_contribution_id: null,
          new_collection_id: null,
        })
        .select('id')
        .single();
      if (approvalError) {
        console.error('[applyToJoin] no_wine_apply insert failed:', approvalError.message);
      } else if (approval?.id) {
        // Auto-cast the requester's own approve vote so single-voter
        // rooms (brand-new gathering with only a host) resolve instantly
        // once the host approves.
        await supabase.from('gathering_approval_votes').insert({
          approval_id: approval.id,
          voter_id: user.id,
          vote: 'approve',
        });
      }
    }

    await afterChange();
    return true;
  }

  async function respondToApplicant(applicantUserId: string, approve: boolean): Promise<void> {
    if (!user) return;
    const newStatus = approve ? 'approved' : 'rejected';

    await supabase
      .from('gathering_members')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('gathering_id', gatheringId)
      .eq('user_id', applicantUserId);

    // Sync the applicant's contribution: approved → committed, rejected →
    // canceled. Host slots stay committed (untouched).
    await supabase
      .from('gathering_contributions')
      .update({ status: approve ? 'committed' : 'canceled' })
      .eq('gathering_id', gatheringId)
      .eq('user_id', applicantUserId)
      .eq('status', 'pending');

    await afterChange();
  }

  /**
   * Host-only: turn a blind slot into a real bottle by filling
   * collection_id and clearing is_blind. The row stays 'committed' since
   * host slots are implicitly self-approved.
   */
  async function revealBlindSlot(contributionId: number, newCollectionId: number): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from('gathering_contributions')
      .update({
        is_blind: false,
        collection_id: newCollectionId,
        status: 'committed',
      })
      .eq('id', contributionId)
      .eq('user_id', user.id); // RLS also enforces; explicit for clarity
    if (error) {
      Alert.alert('Error', error.message);
      return false;
    }
    await afterChange();
    return true;
  }

  async function leaveGathering(): Promise<void> {
    if (!user) return;
    // Cancel any pending/committed contribution first — the
    // (gathering_id, collection_id) unique index would otherwise block
    // re-applying with the same bottle later.
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
    await afterChange();
  }

  return { applyToJoin, respondToApplicant, revealBlindSlot, leaveGathering };
}
