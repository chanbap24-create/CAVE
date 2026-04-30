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
    } else if (gatheringType === 'donation') {
      // donation 모임은 가져갈 와인이 선택사항. 와인 없이 신청하면 호스트 +
      // 기존 approved 멤버의 만장일치(no_wine_apply)가 필요.
      // cost_share / byob 는 이 분기 진입 X:
      //   - cost_share 는 호스트가 와인 준비, 신청자는 비용만 분담 → 호스트
      //     단독 승인으로 충분 (별도 approval 흐름 X).
      //   - byob 는 자기 와인 필수 (위에서 collectionId 검사로 차단).
      const { error: approvalError } = await supabase
        .from('gathering_approvals')
        .insert({
          gathering_id: gatheringId,
          requester_id: user.id,
          request_type: 'no_wine_apply',
          target_contribution_id: null,
          new_collection_id: null,
        });
      if (approvalError) {
        console.error('[applyToJoin] no_wine_apply insert failed:', approvalError.message);
      }
      // 신청자 자신의 approve 자가-투표는 의도적으로 제거. RLS(votes_insert_
      // member_or_host)가 'approved' 상태인 voter 만 허용하므로 어차피 실패할
      // 뿐 아니라, 신청자가 자기 승인 카운트를 올리는 건 만장일치 의도와도
      // 안 맞음 (applicant 는 voter 풀에 들어가지 않음).
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
