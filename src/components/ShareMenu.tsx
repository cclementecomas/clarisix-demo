// ─── Reusable branded-image share control ────────────────────────────────────
// Copy-as-image + Save-PNG buttons with a success toast, matching the Period
// Snapshot share. Pass a `build` that returns a branded canvas.

import { useState, useEffect, useCallback } from 'react';
import { Download, Image } from 'lucide-react';
import { preloadLogo, downloadCanvas, copyCanvas } from '../utils/brandedShare';

export default function ShareMenu({ build, filename }: { build: () => HTMLCanvasElement; filename: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => { preloadLogo(); }, []);

  const run = useCallback(async (mode: 'copy' | 'save') => {
    setBusy(true);
    try {
      await preloadLogo();
      const canvas = build();
      if (mode === 'save') {
        downloadCanvas(canvas, filename);
        setDone('Image saved');
      } else {
        const r = await copyCanvas(canvas, filename);
        setDone(r === 'clipboard' ? 'Copied to clipboard' : 'Image saved');
      }
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setBusy(false);
      setTimeout(() => setDone(null), 3000);
    }
  }, [build, filename]);

  return (
    <div className="flex items-center gap-1">
      {done && <span className="text-[11px] text-green-600 font-medium mr-1 animate-fade-slide-in">{done}!</span>}
      <button
        onClick={() => run('copy')}
        disabled={busy}
        title="Copy as branded image"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-cx-600 hover:bg-cx-50 rounded-md transition-all disabled:opacity-50"
      >
        <Image className="w-3.5 h-3.5" />
        {busy ? 'Generating…' : 'Copy image'}
      </button>
      <button
        onClick={() => run('save')}
        disabled={busy}
        title="Download branded PNG"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-cx-600 hover:bg-cx-50 rounded-md transition-all disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        Save PNG
      </button>
    </div>
  );
}
