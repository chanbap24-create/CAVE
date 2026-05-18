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
  /** 등록할 보틀 수 (기본 1). N개면 같은 collections row를 N개 생성. */
  quantity?: number;
}

interface AddNewInput {
  extracted: ExtractedWineInfo & { name: string }; // name required for new rows
  source?: Source;
  /** Personal photo URL saved on the collections row (not on wines). */
  photoUrl?: string | null;
  /** 등록할 보틀 수 (기본 1). N개면 같은 collections row를 N개 생성. */
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
      // vintage_year schema is smallint, so NV/MV can't live there.
      // We carry the intent in wines.metadata.vintage_type instead and clear
      // the year so the two stay in sync.
      const isNvOrMv = extracted.vintage_type === 'nv' || extracted.vintage_type === 'mv';
      const metadata = isNvOrMv ? { vintage_type: extracted.vintage_type } : {};

      const { data: wine, error: wineError } = await supabase
        .from('wines')
        .insert({
          name: extracted.name,
          name_ko: extracted.name_ko,
          producer: extracted.producer,
          region: extracted.region,
          country: extracted.country,
          vintage_year: isNvOrMv ? null : extracted.vintage_year,
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
 * Insert N collections rows in one round-trip. photo_url 컬럼이 서버에서 거부되면
 * (e.g. 00021 migration 미적용) photo_url 없이 재시도해 멤버십만이라도 저장한다.
 *
 * quantity > 1 이면 row 를 N개 동일 base로 복제. (DB 스키마 변경 없이 보유 수량을
 * "같은 wine_id 가 N개" 로 표현. 화면에선 count로 합쳐 보여준다.)
 */
async function insertCollectionRows(
  base: Record<string, any>,
  photoUrl: string | null | undefined,
  quantity: number,
) {
  const rows = Array.from({ length: quantity }, () => ({ ...base }));
  if (photoUrl) {
    const withPhoto = rows.map((r) => ({ ...r, photo_url: photoUrl }));
    const first = await supabase.from('collections').insert(withPhoto);
    if (!first.error) return first;
    const msg = first.error.message?.toLowerCase() ?? '';
    const schemaIssue = msg.includes('photo_url') || msg.includes('column');
    if (!schemaIssue) return first;
    console.warn('[addToCave] photo_url rejected, retrying without:', first.error.message);
  }
  return supabase.from('collections').insert(rows);
}
