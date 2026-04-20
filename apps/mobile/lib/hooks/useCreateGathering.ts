import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';
import type { GatheringType } from '@/lib/types/gathering';

export interface HostSlotInput {
  collection_id: number | null;
  is_blind: boolean;
}

export interface CreateGatheringInput {
  title: string;
  description: string;
  location: string;
  gatheringDate: Date;
  maxMembers: number;
  pricePerPerson: number | null;
  category: string | null;
  gatheringType: GatheringType;
  hostSlots: HostSlotInput[];
}

export function useCreateGathering(onCreated?: () => void) {
  const { user } = useAuth();

  async function createGathering(input: CreateGatheringInput) {
    if (!user) return false;
    if (!input.title.trim()) { Alert.alert('', 'Title is required'); return false; }
    if (!input.location.trim()) { Alert.alert('', 'Location is required'); return false; }

    // cost_share requires at least one host wine (including blind slots).
    if (input.gatheringType === 'cost_share' && input.hostSlots.length === 0) {
      Alert.alert('', 'Cost share 모임은 최소 한 병의 와인을 준비해야 합니다');
      return false;
    }

    const payload: Record<string, any> = {
      host_id: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      location: input.location.trim(),
      gathering_date: input.gatheringDate.toISOString(),
      max_members: input.maxMembers,
      // Price only meaningful for cost_share.
      price_per_person: input.gatheringType === 'cost_share' ? input.pricePerPerson : null,
      gathering_type: input.gatheringType,
      status: 'open',
    };
    if (input.category) payload.category = input.category;

    const { data: gathering, error } = await supabase
      .from('gatherings')
      .insert(payload)
      .select('id')
      .single();

    if (error || !gathering) {
      Alert.alert('Error', error?.message ?? 'Failed to create gathering');
      return false;
    }

    // Insert host wine slots. Each row is committed (not pending) because
    // the host is implicitly self-approved.
    if (input.hostSlots.length > 0) {
      const slotRows = input.hostSlots.map((s, i) => ({
        gathering_id: gathering.id,
        user_id: user.id,
        collection_id: s.collection_id,
        is_blind: s.is_blind,
        slot_order: i,
        status: 'committed',
      }));
      const { error: slotError } = await supabase
        .from('gathering_contributions')
        .insert(slotRows);
      if (slotError) {
        console.error('[useCreateGathering] host slots failed:', slotError.message);
        // Gathering is already created; surface the error but don't rollback.
        Alert.alert('주의', '모임은 만들었으나 준비 와인 저장에 실패했습니다. 상세 페이지에서 수동 추가해주세요.');
      }
    }

    onCreated?.();
    return true;
  }

  return { createGathering };
}
