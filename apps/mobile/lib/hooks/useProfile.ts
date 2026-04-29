import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/utils/imageUpload';

export interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  collection_count: number;
  /** 파트너 자격 — 관리자가 부여 (v1). UI 에 PartnerBadge 노출 */
  is_partner?: boolean | null;
  /** 파트너 표시명 (예: 'ABC 와인샵', '소믈리에 김XX') */
  partner_label?: string | null;
  /** 파트너 자기소개 (모임 카드에 노출) */
  partner_bio?: string | null;
  /** 파트너 경력/이력 (멀티라인) */
  partner_career?: string | null;
  /** 전문분야 태그 (예: ['부르고뉴', '내추럴 와인']) */
  partner_specialties?: string[] | null;
  /** 파트너 대표 사진 URL (avatar 와 별개. 모임 카드 헤더에 사용) */
  partner_photo_url?: string | null;
}

interface SaveInput {
  displayName: string;
  username: string;
  bio: string;
  avatarUri: string | null;
}

interface SaveResult {
  ok: boolean;
  error?: 'username_taken' | 'other';
  message?: string;
}

/**
 * Profile CRUD for the current user.
 *
 * Accepts secondary focus-time loaders (posts/taste/badges) and runs them in
 * parallel via Promise.all on focus — replaces the original 4 sequential
 * loadX() calls that re-ran on every tab focus.
 */
export function useProfile(
  userId: string | undefined,
  userEmail: string | null | undefined,
  extraLoaders: Array<() => void | Promise<any>> = [],
) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      return;
    }
    // Profile doesn't exist yet — create one then reload.
    const base = userEmail?.split('@')[0] ?? 'user';
    const username = `${base}_${Math.floor(Math.random() * 1000)}`;
    await supabase.from('profiles').insert({
      id: userId,
      username,
      display_name: base,
    });
    const { data: created } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (created) setProfile(created);
  }, [userId, userEmail]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      Promise.all([load(), ...extraLoaders.map(fn => fn())]).catch(() => {});
    }, [userId, load]),
  );

  async function save(input: SaveInput): Promise<SaveResult> {
    if (!userId) return { ok: false, error: 'other', message: 'Not signed in' };
    if (!input.username.trim()) {
      return { ok: false, error: 'other', message: 'Username is required' };
    }

    let avatarUrl = profile?.avatar_url ?? null;
    if (input.avatarUri && input.avatarUri !== profile?.avatar_url) {
      const uploaded = await uploadImage(input.avatarUri, userId);
      if (uploaded) avatarUrl = uploaded;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: input.displayName.trim() || null,
        username: input.username.trim(),
        bio: input.bio.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq('id', userId);

    if (error) {
      return {
        ok: false,
        error: error.message.includes('unique') ? 'username_taken' : 'other',
        message: error.message,
      };
    }

    await load();
    return { ok: true };
  }

  return { profile, load, save };
}
