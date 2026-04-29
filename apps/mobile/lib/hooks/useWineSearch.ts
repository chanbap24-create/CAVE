import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizeSearch } from '@/lib/utils/searchUtils';

export interface WineSearchResult {
  id: number;
  name: string;
  name_ko: string | null;
  category: string;
  country: string | null;
  region: string | null;
  alcohol_pct: number | null;
}

export function useWineSearch() {
  const [results, setResults] = useState<WineSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function searchWines(query: string, limit: number = 20) {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);

    const q = sanitizeSearch(query);
    const { data } = await supabase
      .from('wines')
      .select('id, name, name_ko, category, country, region, alcohol_pct')
      .or(`name.ilike.%${q}%,name_ko.ilike.%${q}%,producer.ilike.%${q}%`)
      .order('name')
      .limit(limit);

    if (data) setResults(data);
    setLoading(false);
  }

  function clearResults() {
    setResults([]);
  }

  return { results, loading, searchWines, clearResults };
}
