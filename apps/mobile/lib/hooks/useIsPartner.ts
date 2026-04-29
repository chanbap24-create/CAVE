import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface State {
  isPartner: boolean;
  partnerLabel: string | null;
  loading: boolean;
}

/**
 * 현재 로그인 사용자의 파트너 자격 여부.
 *  - is_partner=true 인 사용자만 host_type != 'user' 모임 생성 가능
 *  - partner_label 은 UI 노출용 호스트 라벨 (예: 'ABC 와인샵')
 *
 * 관리자가 DB 에서 직접 부여 (v1). v2 에서 신청/승인 흐름 추가.
 */
export function useIsPartner(): State {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ isPartner: false, partnerLabel: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setState({ isPartner: false, partnerLabel: null, loading: false });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_partner, partner_label')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        isPartner: !!data?.is_partner,
        partnerLabel: data?.partner_label ?? null,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return state;
}
