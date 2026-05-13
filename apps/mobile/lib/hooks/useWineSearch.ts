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

    // search_wines RPC: search_vector + tsquery prefix.
    // 119,609 행 ilike 풀스캔 (610ms~2.6s) → GIN 인덱스 (40ms 이하).
    const q = sanitizeSearch(query);
    const { data } = await supabase.rpc('search_wines', { q, lim: limit });

    if (data) setResults(data as WineSearchResult[]);
    setLoading(false);
  }

  function clearResults() {
    setResults([]);
  }

  return { results, loading, searchWines, clearResults };
}
