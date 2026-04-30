import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeaturedCave {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  collection_count: number;
  countries: number;
  top_category: string | null;
  badges: string[];
  activeGatherings: number;
  latestPostImage: string | null;
  latestVideoPlaybackId: string | null;
}

interface RpcRow {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  collection_count: number;
  countries: number;
  top_category: string | null;
  hosted_count: number;
  joined_count: number;
  latest_post_id: number | null;
  latest_video_playback_id: string | null;
}

/**
 * 셀러 발견 데이터 — 1000 CCU 확장성을 위해 server-side RPC 로 일원화.
 *
 * 이전 구현은 collections 테이블을 1000~2000 row 다운로드 후 클라이언트에서
 * group by → 6 round-trip batch fetch 로 enrichment 했음. 1000 CCU 가 홈 탭
 * 진입할 때마다 큰 부하.
 *
 * 현재: RPC `get_featured_caves(category, limit)` 가 ranking + 거의 모든
 * enrichment (profile / countries / top category / hosted+joined / latest post)
 * 를 한 번에 처리. 클라이언트는 (있으면) latest post 의 이미지 URL 만 추가
 * batch 1회로 가져옴.
 */
export function useFeaturedCaves(category?: string | null) {
  const [caves, setCaves] = useState<FeaturedCave[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeatured = useCallback(async () => {
    setLoading(true);

    const { data: rpcRows, error: rpcError } = await supabase.rpc('get_featured_caves', {
      p_category: category ?? null,
      p_limit: 10,
    });

    if (rpcError || !rpcRows) {
      if (__DEV__) console.warn('[useFeaturedCaves] rpc error:', rpcError?.message);
      setCaves([]);
      setLoading(false);
      return;
    }

    const rows = rpcRows as RpcRow[];
    if (rows.length === 0) {
      setCaves([]);
      setLoading(false);
      return;
    }

    // latest post 의 image_url 만 추가 batch (post 가 있고 video 가 없는 경우만).
    const photoPostIds = rows
      .filter(r => r.latest_post_id != null && !r.latest_video_playback_id)
      .map(r => r.latest_post_id as number);

    let imgMap = new Map<number, string>();
    if (photoPostIds.length > 0) {
      const { data: imgs } = await supabase
        .from('post_images')
        .select('post_id, image_url')
        .in('post_id', photoPostIds);
      (imgs || []).forEach(img => {
        if (!imgMap.has(img.post_id)) imgMap.set(img.post_id, img.image_url);
      });
    }

    const enriched: FeaturedCave[] = rows.map(r => {
      const badges: string[] = [];
      if (r.collection_count >= 100) badges.push('Master');
      else if (r.collection_count >= 50) badges.push('Expert');
      else if (r.collection_count >= 10) badges.push('Collector');
      if (r.countries >= 5) badges.push('World Traveler');

      let latestPostImage: string | null = null;
      if (r.latest_video_playback_id) {
        latestPostImage = `https://image.mux.com/${r.latest_video_playback_id}/thumbnail.jpg?width=400&height=500&fit_mode=crop`;
      } else if (r.latest_post_id != null) {
        latestPostImage = imgMap.get(r.latest_post_id) || null;
      }

      return {
        user_id: r.user_id,
        username: r.username,
        display_name: r.display_name,
        avatar_url: r.avatar_url,
        collection_count: r.collection_count,
        countries: r.countries,
        top_category: r.top_category,
        badges,
        activeGatherings: (r.hosted_count || 0) + (r.joined_count || 0),
        latestPostImage,
        latestVideoPlaybackId: r.latest_video_playback_id,
      };
    });

    setCaves(enriched);
    setLoading(false);
  }, [category]);

  return { caves, loading, refresh: loadFeatured };
}
