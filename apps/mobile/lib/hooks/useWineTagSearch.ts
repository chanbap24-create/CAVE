import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizeSearch } from '@/lib/utils/searchUtils';

export interface WineTag {
  id: string;
  name: string;
  name_ko: string | null;
  category: string | null;
}

export function useWineTagSearch() {
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState<WineTag[]>([]);
  const [taggedWine, setTaggedWine] = useState<WineTag | null>(null);

  async function searchWines(query: string) {
    setTagSearch(query);
    if (query.length < 2) {
      setTagResults([]);
      return;
    }
    const q = sanitizeSearch(query);
    const { data } = await supabase
      .from('wines')
      .select('id, name, name_ko, category')
      .or(`name.ilike.%${q}%,name_ko.ilike.%${q}%`)
      .limit(5);
    if (data) setTagResults(data as WineTag[]);
  }

  function selectWine(wine: WineTag) {
    setTaggedWine(wine);
    setTagSearch('');
    setTagResults([]);
  }

  function clearTag() {
    setTaggedWine(null);
  }

  function reset() {
    setTagSearch('');
    setTagResults([]);
    setTaggedWine(null);
  }

  return {
    tagSearch,
    tagResults,
    taggedWine,
    searchWines,
    selectWine,
    clearTag,
    reset,
  };
}
