// Domain types for wine scanning & matching flows.
// Mirrors the `wines` table (supabase/migrations/00001_initial_schema.sql).

export type DrinkCategory = 'wine' | 'whiskey' | 'sake' | 'cognac' | 'other';

/**
 * How a bottle's vintage is expressed:
 *   'year' → a specific harvest year is printed (`vintage_year` is set).
 *   'nv'   → Non-Vintage (common for Champagne/sparkling blends).
 *   'mv'   → Multi-Vintage (explicit multi-year blend).
 * 'nv'/'mv' always pair with `vintage_year = null`.
 */
export type VintageType = 'year' | 'nv' | 'mv';

/** Minimal shape of a wines-table row used in client flows. */
export interface WineRow {
  id: number;
  name: string;
  name_ko: string | null;
  producer: string | null;
  region: string | null;
  country: string | null;
  vintage_year: number | null;
  alcohol_pct: number | null;
  category: DrinkCategory;
  image_url: string | null;
}

/**
 * Fields Claude Vision is expected to extract from a label photo.
 * All fields nullable — the model may miss anything depending on label clarity.
 */
export interface ExtractedWineInfo {
  name: string | null;
  name_ko: string | null;
  producer: string | null;
  region: string | null;
  country: string | null;
  vintage_year: number | null;
  vintage_type: VintageType | null; // null = not indicated on the label
  category: DrinkCategory;
  confidence: number; // 0..1 — overall confidence the label was readable
}

/**
 * Result of fuzzy-matching ExtractedWineInfo against existing wines.
 * kind === 'match' means an existing row should be preferred;
 * 'new' means insert a new wines row on save.
 */
export type WineMatchResult =
  | { kind: 'match'; wine: WineRow; score: number }
  | { kind: 'new' };
