import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ExtractedWineInfo, WineRow } from '@/lib/types/wine';

type Source = 'manual' | 'photo' | 'search' | 'shop_purchase' | 'gift';

interface AddExistingInput {
  wineId: number;
  source?: Source;
  /** Personal photo URL saved on the collections row (not on wines). */
  photoUrl?: string | null;
  /** 보유 수량. collections.quantity 단일 컬럼에 저장 (row 1개). */
  quantity?: number;
}

interface AddNewInput {
  extracted: ExtractedWineInfo & { name: string }; // name required for new rows
  source?: Source;
  /** Personal photo URL saved on the collections row (not on wines). */
  photoUrl?: string | null;
  /** 보유 수량. collections.quantity 단일 컬럼에 저장 (row 1개). */
  quantity?: number;
}

function clampQuantity(q: number | undefined): number {
  if (!q || !Number.isFinite(q) || q < 1) return 1;
  return Math.min(Math.floor(q), 99);
}

/**
 * Shared cellar-insert hook. Two entry points:
 *  - addExisting: reference a known wines row (search flow, auto-match)
 *  - addNew: insert a new wines row first (scan flow, no match) then reference it
 *
 * Returns `adding` so callers can disable buttons during the round-trip.
 */
export function useAddToCave() {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

  async function addExisting({
    wineId, source = 'search', photoUrl, quantity,
  }: AddExistingInput): Promise<boolean> {
    if (!user || adding) return false;
    setAdding(true);
    try {
      const base: Record<string, any> = { user_id: user.id, wine_id: wineId, source };
      const { error } = await insertCollectionRows(base, photoUrl, clampQuantity(quantity));
      if (error) console.error('[addToCave:addExisting]', error.message);
      return !error;
    } finally {
      setAdding(false);
    }
  }

  async function addNew({ extracted, source = 'photo', photoUrl, quantity }: AddNewInput): Promise<WineRow | null> {
    if (!user || adding) return null;
    setAdding(true);
    try {
      const isNvOrMv = extracted.vintage_type === 'nv' || extracted.vintage_type === 'mv';
      const metadata = isNvOrMv ? { vintage_type: extracted.vintage_type } : {};
      const normVintage = isNvOrMv ? null : extracted.vintage_year ?? null;

      // ─ pre-check ─ 동일 (name, producer, vintage_year) wines 가 이미 있으면 INSERT 안 함.
      // 이전엔 라벨 스캔 = 항상 신규 wines INSERT 라 같은 와인 wine_id 가 늘었음 → 셀러 중복.
      // 정확 매칭만 (name 대소문자 ignore, producer / vintage 일치). 부분 매칭은
      // useWineMatch 의 유사도 점수가 별도로 처리.
      let q = supabase
        .from('wines')
        .select('id, name, name_ko, producer, region, country, vintage_year, alcohol_pct, category, image_url')
        .ilike('name', extracted.name)
        .limit(5);
      if (extracted.producer) q = q.ilike('producer', extracted.producer);
      if (normVintage != null) q = q.eq('vintage_year', normVintage);
      else q = q.is('vintage_year', null);
      const { data: existing } = await q;
      const match = existing && existing.length > 0 ? existing[0] : null;
      if (match) {
        // 기존 wines 재사용 — collections upsert 로 수량 합치기
        const base: Record<string, any> = { user_id: user.id, wine_id: match.id, source };
        const { error } = await insertCollectionRows(base, photoUrl, clampQuantity(quantity));
        if (error) console.error('[addToCave:addNew reuse]', error.message);
        return error ? null : (match as WineRow);
      }

      const { data: wine, error: wineError } = await supabase
        .from('wines')
        .insert({
          name: extracted.name,
          name_ko: extracted.name_ko,
          producer: extracted.producer,
          region: extracted.region,
          country: extracted.country,
          vintage_year: normVintage,
          category: extracted.category,
          metadata,
          created_by: user.id,
          verified: false,
        })
        .select('id, name, name_ko, producer, region, country, vintage_year, alcohol_pct, category, image_url')
        .single();

      if (wineError || !wine) {
        if (wineError) console.error('[addToCave:addNew wines]', wineError.message);
        return null;
      }

      const base: Record<string, any> = {
        user_id: user.id,
        wine_id: wine.id,
        source,
      };
      const { error: collectionError } = await insertCollectionRows(base, photoUrl, clampQuantity(quantity));
      if (collectionError) {
        console.error('[addToCave:addNew collections]', collectionError.message);
        return null;
      }
      return wine as WineRow;
    } finally {
      setAdding(false);
    }
  }

  return { addExisting, addNew, adding };
}

/**
 * 셀러 등록 — 이미 있는 와인이면 quantity 더함, 없으면 INSERT.
 * UNIQUE(user_id, wine_id) 제약 (00075) 으로 dedup 보장.
 */
async function insertCollectionRows(
  base: Record<string, any>,
  photoUrl: string | null | undefined,
  quantity: number,
) {
  const userId = base.user_id;
  const wineId = base.wine_id;
  // 기존 행 조회
  const { data: existing } = await supabase
    .from('collections')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('wine_id', wineId)
    .maybeSingle();

  if (existing) {
    // 수량만 합치고 (사진/노트 등 다른 정보는 유지). photo_url 은 새것 우선.
    const newQty = (existing.quantity ?? 1) + quantity;
    const patch: Record<string, any> = { quantity: newQty };
    if (photoUrl) patch.photo_url = photoUrl;
    return supabase.from('collections').update(patch).eq('id', existing.id);
  }

  // 신규 INSERT
  const row: Record<string, any> = { ...base, quantity };
  if (photoUrl) {
    const withPhoto = { ...row, photo_url: photoUrl };
    const first = await supabase.from('collections').insert(withPhoto);
    if (!first.error) return first;
    const msg = first.error.message?.toLowerCase() ?? '';
    const schemaIssue = msg.includes('photo_url') || msg.includes('column');
    if (!schemaIssue) return first;
    console.warn('[addToCave] photo_url rejected, retrying without:', first.error.message);
  }
  return supabase.from('collections').insert(row);
}
