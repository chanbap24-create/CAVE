import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface DrinkCategory {
  key: string;
  parent_key: string | null;
  label: string;
  label_ko: string | null;
  bg_color: string | null;
  text_color: string | null;
  sort_order: number;
}

// Used when the drink_categories table doesn't exist yet (migration not applied)
// OR the fetch fails for any reason. Keeps the UI functional either way.
const FALLBACK_CATEGORIES: DrinkCategory[] = [
  { key: 'wine',        parent_key: null, label: 'Wine',        label_ko: '와인',    bg_color: '#f7f0f3', text_color: '#7b2d4e', sort_order: 10 },
  { key: 'spirit',      parent_key: null, label: 'Spirit',      label_ko: '스피릿',  bg_color: '#f5f0e8', text_color: '#8a6d3b', sort_order: 20 },
  { key: 'traditional', parent_key: null, label: 'Traditional', label_ko: '전통주',  bg_color: '#eef2f7', text_color: '#3b6d8a', sort_order: 30 },
  { key: 'other',       parent_key: null, label: 'Other',       label_ko: '기타',    bg_color: '#f0f0f0', text_color: '#666666', sort_order: 40 },
];

// Module-level cache so the full list is fetched once per app session
// and shared across all consumers. Re-fetch happens on demand via `refresh()`.
let cache: DrinkCategory[] | null = null;
let pending: Promise<DrinkCategory[]> | null = null;
const listeners = new Set<(cats: DrinkCategory[]) => void>();

async function load(force = false): Promise<DrinkCategory[]> {
  if (cache && !force) return cache;
  if (pending && !force) return pending;

  pending = supabase
    .from('drink_categories')
    .select('key, parent_key, label, label_ko, bg_color, text_color, sort_order')
    .eq('is_active', true)
    .order('sort_order')
    .then(({ data, error }) => {
      // If the table doesn't exist or the fetch fails, fall back to hardcoded list
      // so the UI still shows selectable chips.
      if (error || !data || data.length === 0) {
        cache = FALLBACK_CATEGORIES;
      } else {
        cache = data;
      }
      pending = null;
      listeners.forEach(l => l(cache!));
      return cache;
    });

  return pending;
}

/**
 * Hook returning the active drink-category list (cached per session).
 * Returns fallback constants immediately so UI never waits on network.
 */
export function useDrinkCategories() {
  const [categories, setCategories] = useState<DrinkCategory[]>(cache ?? FALLBACK_CATEGORIES);

  useEffect(() => {
    let mounted = true;
    load().then(cats => { if (mounted) setCategories(cats); });
    const listener = (cats: DrinkCategory[]) => { if (mounted) setCategories(cats); };
    listeners.add(listener);
    return () => { mounted = false; listeners.delete(listener); };
  }, []);

  return {
    categories,
    refresh: () => load(true),
    byKey: (key: string | null | undefined) =>
      key ? categories.find(c => c.key === key) ?? null : null,
  };
}
