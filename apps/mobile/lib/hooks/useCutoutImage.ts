import { useEffect, useState } from 'react';
import { extractSubject, isSubjectExtractionSupported } from '@/lib/native/subjectExtractor';

// 5-state machine for the cover-image cutout pipeline.
// Lives inside GatheringCoverImageField; consumers read `current` for the URI
// to actually display/upload (cutout when ready+enabled, original otherwise).
export type CutoutState =
  | { kind: 'empty' }
  | { kind: 'idle';        original: string }
  | { kind: 'processing';  original: string }
  | { kind: 'ready';       original: string; cutout: string }
  | { kind: 'unsupported'; original: string };

export interface UseCutoutImage {
  state: CutoutState;
  /** URI to currently show in preview / submit to upload. */
  current: string | null;
}

/**
 * Drives subject extraction for a single original image URI. Re-runs whenever
 * the URI changes; cancels the in-flight result if the URI changes mid-flight.
 *
 * `enabled` controls whether the cutout is *used* (toggle ON, layout supports
 * it). Extraction itself runs whenever the device supports it, so flipping
 * the toggle back on is instant once the result is cached upstream.
 */
export function useCutoutImage(originalUri: string | null, enabled: boolean): UseCutoutImage {
  const [state, setState] = useState<CutoutState>({ kind: 'empty' });

  useEffect(() => {
    if (!originalUri) {
      setState({ kind: 'empty' });
      return;
    }
    if (!isSubjectExtractionSupported()) {
      setState({ kind: 'unsupported', original: originalUri });
      return;
    }
    let cancelled = false;
    setState({ kind: 'processing', original: originalUri });
    extractSubject(originalUri).then((cutout) => {
      if (cancelled) return;
      if (cutout) {
        setState({ kind: 'ready', original: originalUri, cutout });
      } else {
        // Treat null as unsupported-for-this-image — hide the toggle and
        // fall back to the original. We do not retry.
        setState({ kind: 'unsupported', original: originalUri });
      }
    });
    return () => { cancelled = true; };
  }, [originalUri]);

  const current = pickCurrent(state, enabled);
  return { state, current };
}

function pickCurrent(state: CutoutState, enabled: boolean): string | null {
  if (state.kind === 'empty') return null;
  if (state.kind === 'ready' && enabled) return state.cutout;
  return state.original;
}
