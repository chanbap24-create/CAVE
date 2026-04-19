import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ExtractedWineInfo, WineRow } from '@/lib/types/wine';

type Source = 'manual' | 'photo' | 'search' | 'shop_purchase' | 'gift';

interface AddExistingInput {
  wineId: number;
  source?: Source;
}

interface AddNewInput {
  extracted: ExtractedWineInfo & { name: string }; // name required for new rows
  source?: Source;
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

  async function addExisting({ wineId, source = 'search' }: AddExistingInput): Promise<boolean> {
    if (!user || adding) return false;
    setAdding(true);
    try {
      const { error } = await supabase
        .from('collections')
        .insert({ user_id: user.id, wine_id: wineId, source });
      return !error;
    } finally {
      setAdding(false);
    }
  }

  async function addNew({ extracted, source = 'photo' }: AddNewInput): Promise<WineRow | null> {
    if (!user || adding) return null;
    setAdding(true);
    try {
      const { data: wine, error: wineError } = await supabase
        .from('wines')
        .insert({
          name: extracted.name,
          name_ko: extracted.name_ko,
          producer: extracted.producer,
          region: extracted.region,
          country: extracted.country,
          vintage_year: extracted.vintage_year,
          category: extracted.category,
          created_by: user.id,
          verified: false,
        })
        .select('id, name, name_ko, producer, region, country, vintage_year, alcohol_pct, category, image_url')
        .single();

      if (wineError || !wine) return null;

      const { error: collectionError } = await supabase
        .from('collections')
        .insert({ user_id: user.id, wine_id: wine.id, source });

      return collectionError ? null : (wine as WineRow);
    } finally {
      setAdding(false);
    }
  }

  return { addExisting, addNew, adding };
}
