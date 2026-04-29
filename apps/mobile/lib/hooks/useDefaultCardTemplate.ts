import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { DEFAULT_CARD_TEMPLATE } from '@/lib/constants/cardTemplates';

interface State {
  /** 호스트가 프로필에 저장한 기본 디자인. 미설정 시 system default. */
  defaultCardTemplate: string;
  loading: boolean;
  /** 프로필 default 를 즉시 갱신 (낙관적) */
  setDefaultLocally: (key: string) => void;
  /** DB 에 저장 */
  saveDefault: (key: string) => Promise<boolean>;
}

/**
 * 모임 개설 시 폼이 초기화되는 카드 디자인.
 * 트레바리 패턴: 호스트마다 "내 시그니처" 컬러를 둬서 브랜드 일관성을
 * 유지하되, 모임마다 변경 가능 (폼에서 picker 노출).
 */
export function useDefaultCardTemplate(): State {
  const { user } = useAuth();
  const [defaultCardTemplate, setDefaultCardTemplate] = useState<string>(DEFAULT_CARD_TEMPLATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('default_card_template')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setDefaultCardTemplate(data?.default_card_template || DEFAULT_CARD_TEMPLATE);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function saveDefault(key: string): Promise<boolean> {
    if (!user?.id) return false;
    setDefaultCardTemplate(key);
    const { error } = await supabase
      .from('profiles')
      .update({ default_card_template: key })
      .eq('id', user.id);
    if (error) {
      console.error('[useDefaultCardTemplate] save failed:', error.message);
      return false;
    }
    return true;
  }

  return {
    defaultCardTemplate,
    loading,
    setDefaultLocally: setDefaultCardTemplate,
    saveDefault,
  };
}
