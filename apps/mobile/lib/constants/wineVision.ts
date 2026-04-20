// Wine label Vision API configuration.
// Centralized so the real Claude API integration only needs to flip
// VISION_MODE from 'mock' to 'claude' and set the endpoint/secret.

export type VisionMode = 'mock' | 'claude';

// Swap back to 'mock' to develop without spending Anthropic credits.
export const VISION_MODE: VisionMode = 'claude';

// Simulated latency for the mock extractor (ms). Matches a realistic
// round-trip so UI loading states look right during development.
export const MOCK_VISION_LATENCY_MS = 1500;

// Minimum confidence below which we warn the user and default to manual edit.
export const MIN_VISION_CONFIDENCE = 0.55;

// Fuzzy-match thresholds for proposing an existing wines row vs. creating new.
export const MATCH_SCORE_AUTO = 0.85; // >= auto-suggest this wine
export const MATCH_SCORE_NEW = 0.5;   // < this → propose creating new

// Placeholder for the future Edge Function endpoint.
// Used when VISION_MODE === 'claude'.
export const CLAUDE_VISION_ENDPOINT = '/functions/v1/wine-vision';
