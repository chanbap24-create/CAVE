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
}

interface AddNewInput {
  extracted: ExtractedWineInfo & { name: string }; // name required for new rows
  source?: Source;
  /** Personal photo URL saved on the collections row (not on wines). */
  photoUrl?: string | null;
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
    wineId, source = 'search', photoUrl,
  }: AddExistingInput): Promise<boolean> {
    if (!user || adding) return false;
    setAdding(true);
    try {
      const base: Record<string, any> = { user_id: user.id, wine_id: wineId, source };
      const { error } = await insertCollectionRow(base, photoUrl);
      if (error) console.error('[addToCave:addExisting]', error.message);
      return !error;
    } finally {
      setAdding(false);
    }
  }

  async function addNew({ extracted, source = 'photo', photoUrl }: AddNewInput): Promise<WineRow | null> {
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
      const { error: collectionError } = await insertCollectionRow(base, photoUrl);
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
 * Insert a collections row, falling back to the same row without `photo_url`
 * if the server rejects it (most commonly: the 00021 migration isn't applied
 * yet and the column doesn't exist). We'd rather save the membership than
 * block the user on a cosmetic field.
 */
async function insertCollectionRow(
  base: Record<string, any>,
  photoUrl: string | null | undefined,
) {
  if (photoUrl) {
    const withPhoto = { ...base, photo_url: photoUrl };
    const first = await supabase.from('collections').insert(withPhoto);
    if (!first.error) return first;
    // Retry without photo_url on "column photo_url does not exist" (42703)
    // or anything else that looks schema-ish. The retry path also covers
    // transient issues where photo_url is somehow rejected.
    const msg = first.error.message?.toLowerCase() ?? '';
    const schemaIssue = msg.includes('photo_url') || msg.includes('column');
    if (!schemaIssue) return first;
    console.warn('[addToCave] photo_url rejected, retrying without:', first.error.message);
  }
  return supabase.from('collections').insert(base);
}
