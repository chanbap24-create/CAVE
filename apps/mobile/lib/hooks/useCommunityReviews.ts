import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface CommunityReview {
  /** collection_comments.id */
  id: number;
  body: string;
  created_at: string;
  /** 후기 작성자 */
  author: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_partner?: boolean | null;
    partner_label?: string | null;
  } | null;
  /** 후기가 달린 컬렉션 (와인 + 사진) */
  collection: {
    id: number;
    photo_url: string | null;
    user_id: string;
    wine: {
      id: number;
      name: string;
      producer: string | null;
      vintage_year: number | null;
      image_url: string | null;
    } | null;
  } | null;
}

const FETCH_LIMIT = 20;

/**
 * 프로필 화면 하단 "친구들의 시음 후기" 피드.
 *
 * 데이터: collection_comments (테이스팅 코멘트) 를 최신순으로 가져와
 * comment + collection(wine + photo) + author profile 까지 join.
 *
 * v1: 전체 공개 컬렉션 대상 (is_public=true). v2 에서 follows 만 필터로 좁힐
 * 예정. follow 가 적은 초기 사용자도 콘텐츠가 보이도록 일단 전체 노출.
 */
export function useCommunityReviews() {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 최신 코멘트 N개. body 길이 제한이 1~300이라 광고/스팸은 RLS+체크로 다른 곳에서 처리.
      const { data: comments } = await supabase
        .from('collection_comments')
        .select('id, body, created_at, user_id, collection_id')
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);
      if (!comments || comments.length === 0) { setReviews([]); return; }

      const collectionIds = [...new Set(comments.map(c => c.collection_id))];
      const userIds = [...new Set(comments.map(c => c.user_id))];

      const [collectionsRes, profilesRes] = await Promise.all([
        supabase
          .from('collections')
          .select('id, photo_url, user_id, is_public, wine:wines(id, name, producer, vintage_year, image_url)')
          .in('id', collectionIds)
          .eq('is_public', true),
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_partner, partner_label')
          .in('id', userIds),
      ]);

      const colMap = new Map<number, NonNullable<CommunityReview['collection']>>();
      for (const c of (collectionsRes.data || []) as any[]) {
        colMap.set(c.id, {
          id: c.id, photo_url: c.photo_url, user_id: c.user_id,
          wine: c.wine ? {
            id: c.wine.id, name: c.wine.name,
            producer: c.wine.producer ?? null,
            vintage_year: c.wine.vintage_year ?? null,
            image_url: c.wine.image_url ?? null,
          } : null,
        });
      }
      const profMap = new Map<string, NonNullable<CommunityReview['author']>>();
      for (const p of (profilesRes.data || []) as any[]) {
        profMap.set(p.id, {
          id: p.id, username: p.username, display_name: p.display_name,
          avatar_url: p.avatar_url, is_partner: p.is_partner, partner_label: p.partner_label,
        });
      }

      const out: CommunityReview[] = comments
        // 비공개 컬렉션의 댓글은 피드에 포함하지 않음 (collection 조회에서 누락된 케이스)
        .filter(c => colMap.has(c.collection_id))
        .map(c => ({
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          author: profMap.get(c.user_id) || null,
          collection: colMap.get(c.collection_id) || null,
        }));

      setReviews(out);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { reviews, loading, refresh: load };
}
