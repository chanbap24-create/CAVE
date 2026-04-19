import { useState } from 'react';
import { extractWineFromImage } from '@/lib/utils/wineVision';
import { findWineMatch } from '@/lib/hooks/useWineMatch';
import type { ExtractedWineInfo, WineMatchResult } from '@/lib/types/wine';

type ScanStatus = 'idle' | 'analyzing' | 'ready' | 'error';

interface ScanResult {
  extracted: ExtractedWineInfo;
  match: WineMatchResult;
  imageUri: string;
}

/**
 * State machine for the label scan flow.
 *
 * idle     — no image selected; LabelScanSheet shows camera/gallery picker.
 * analyzing — image in hand, Vision call + match lookup in flight.
 * ready    — extracted data + match result available; review UI shown.
 * error    — extraction threw; caller shows retry prompt.
 */
export function useWineLabelScan() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan(imageUri: string) {
    setStatus('analyzing');
    setError(null);
    try {
      const extracted = await extractWineFromImage(imageUri);
      const match = await findWineMatch(extracted);
      setResult({ extracted, match, imageUri });
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message ?? 'Scan failed');
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  return { status, result, error, scan, reset };
}
