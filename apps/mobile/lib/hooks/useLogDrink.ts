import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface LogDrinkInput {
  /** 본인 셀러 컬렉션 id (있으면 wine_id 자동 추론). null 이면 wine_id 필수 */
  collectionId: number | null;
  /** collection 미지정 시 wine_id 직접 (예: 검색에서 선택한 와인). v2 흐름. */
  wineId?: number | null;
  drankAt?: Date; // default: now
  rating?: number | null;
  note?: string | null;
}

const NOTE_MAX = 1000;

/**
 * 와인 시음 이벤트 로그 작성. 셀러의 와인을 마셨다고 표시할 때 호출.
 * v2 에서 검색→로그 흐름은 wineId 단독 입력 지원 (collectionId null).
 */
export function useLogDrink(onLogged?: () => void) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  async function log(input: LogDrinkInput): Promise<boolean> {
    if (!user) return false;
    if (input.collectionId == null && input.wineId == null) {
      Alert.alert('', 'collection 또는 wine 정보가 필요합니다');
      return false;
    }
    if (input.note && input.note.length > NOTE_MAX) {
      Alert.alert('', `메모는 ${NOTE_MAX}자 이하`);
      return false;
    }

    setSaving(true);
    try {
      const norm = (s?: string | null) => (s && s.trim().length > 0 ? s.trim() : null);
      const payload: Record<string, unknown> = {
        user_id: user.id,
        collection_id: input.collectionId,
        wine_id: input.wineId ?? null,
        drank_at: (input.drankAt ?? new Date()).toISOString(),
        rating: input.rating ?? null,
        note: norm(input.note),
      };
      const { error } = await supabase.from('wine_drinks').insert(payload);
      if (error) {
        Alert.alert('저장 실패', error.message);
        return false;
      }
      onLogged?.();
      return true;
    } finally {
      setSaving(false);
    }
  }

  return { log, saving };
}
