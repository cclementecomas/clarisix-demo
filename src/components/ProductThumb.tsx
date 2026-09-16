// Reusable product thumbnail for anywhere an ASIN is shown.
//  • Tier 1: small inline image (sits inside the pinned identity column).
//  • Tier 2: hover preview — larger image + title + ASIN in a portaled popover
//    (portaled so DeepDiveTable's scroll container can't clip it).
// Image source: `imageUrl` if supplied, else a deterministic placeholder derived
// from the ASIN (same ASIN → same image on every page). In the real build this is
// the SP-API Catalog Items main image, keyed by ASIN + marketplace.
// Never renders a broken-image icon: on error it falls back to a hue swatch.
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PLACEHOLDERS = ['bottle', 'jar', 'box', 'pouch', 'tube', 'can', 'dropper', 'spray', 'sachet', 'bag'];

export function hashAsin(asin: string): number {
  let h = 0;
  for (let i = 0; i < asin.length; i++) h = (h * 31 + asin.charCodeAt(i)) >>> 0;
  return h;
}
export function productImageFor(asin: string): string {
  return `/products/${PLACEHOLDERS[hashAsin(asin) % PLACEHOLDERS.length]}.svg`;
}
export function productHue(asin: string): number {
  return hashAsin(asin) % 360;
}

function Swatch({ hue }: { hue: number }) {
  return <span className="block w-full h-full" style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 62%), hsl(${(hue + 28) % 360} 58% 48%))` }} />;
}

export default function ProductThumb({
  asin, title, imageUrl, size = 28, preview = true, className = '',
}: {
  asin: string; title?: string; imageUrl?: string; size?: number; preview?: boolean; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const anchor = useRef<HTMLSpanElement>(null);
  const src = imageUrl ?? productImageFor(asin);
  const hue = productHue(asin);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = anchor.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, left: r.left });
    }, 150);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setPos(null);
  };

  const POP_W = 224;
  return (
    <span
      ref={anchor}
      onMouseEnter={preview ? show : undefined}
      onMouseLeave={preview ? hide : undefined}
      className={`inline-flex items-center justify-center flex-shrink-0 rounded-md bg-white ring-1 ring-black/5 overflow-hidden ${preview ? 'cursor-zoom-in' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {failed
        ? <Swatch hue={hue} />
        : <img src={src} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} className="w-full h-full object-contain select-none" />}

      {preview && pos && createPortal(
        <div className="fixed pointer-events-none" style={{ top: pos.top, left: Math.min(pos.left, window.innerWidth - POP_W - 16), zIndex: 99999 }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-3" style={{ width: POP_W }}>
            <div className="w-full h-[120px] rounded-lg bg-gray-50 ring-1 ring-black/5 flex items-center justify-center overflow-hidden">
              {failed
                ? <span className="w-16 h-16 rounded-md overflow-hidden"><Swatch hue={hue} /></span>
                : <img src={src} alt="" draggable={false} className="max-w-full max-h-full object-contain" />}
            </div>
            {title && (
              <div className="mt-2 text-[12px] font-semibold text-gray-800 leading-snug"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {title}
              </div>
            )}
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{asin}</div>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
