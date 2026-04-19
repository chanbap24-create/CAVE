// Domain types for wine scanning & matching flows.
// Mirrors the `wines` table (supabase/migrations/00001_initial_schema.sql).

export type DrinkCategory = 'wine' | 'whiskey' | 'sake' | 'cognac' | 'other';

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
