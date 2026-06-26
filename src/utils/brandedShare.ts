// ─── Branded image share helpers ─────────────────────────────────────────────
// Reusable canvas primitives for exporting a view as a branded PNG (Clarisix
// logo + citation footer), mirroring the Period Snapshot share on Home.
// Concrete card renderers (see primeDayShare.ts) compose these.

let cachedLogo: HTMLImageElement | null = null;
let logoLoaded = false;

export function preloadLogo(): Promise<void> {
  if (logoLoaded && cachedLogo) return Promise.resolve();
  return new Promise((resolve) => {
    cachedLogo = new window.Image();
    cachedLogo.onload = () => { logoLoaded = true; resolve(); };
    cachedLogo.onerror = () => { logoLoaded = false; resolve(); };
    cachedLogo.src = '/clarisix_logo_orange.png';
  });
}

export const SC = {
  white: '#FFFFFF', ink: '#0B1220', cx: '#0E5A8A', cxLight: '#4B9DCC',
  sub: '#6B7280', faint: '#9CA3AF', border: '#E5E7EB', track: '#F3F4F6',
  tileBg: '#F9FAFB',
  greenText: '#15803D', greenBg: '#F0FDF4',
  redText: '#DC2626', redBg: '#FEF2F2',
  neutralText: '#6B7280', neutralBg: '#F9FAFB',
  FONT: 'Inter, system-ui, sans-serif',
};

export const SHARE_SCALE = 2;

/** Make a hi-DPI canvas + 2d context already scaled. */
export function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w * SHARE_SCALE;
  canvas.height = h * SHARE_SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SHARE_SCALE, SHARE_SCALE);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = SC.white;
  ctx.fillRect(0, 0, w, h);
  return { canvas, ctx };
}

/** Top accent bar + title + subtitle + optional right-aligned badge. */
export function drawCardHeader(
  ctx: CanvasRenderingContext2D, w: number, pad: number,
  title: string, subtitle: string, badge?: string,
) {
  // accent bar
  ctx.fillStyle = SC.cx;
  ctx.fillRect(0, 0, w, 4);

  ctx.fillStyle = SC.cx;
  ctx.font = `800 19px ${SC.FONT}`;
  ctx.fillText(title, pad, 32);

  ctx.fillStyle = SC.sub;
  ctx.font = `400 11px ${SC.FONT}`;
  ctx.fillText(subtitle, pad, 50);

  if (badge) {
    ctx.font = `700 10px ${SC.FONT}`;
    const bw = ctx.measureText(badge).width + 16;
    const bx = w - pad - bw;
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(bx, 18, bw, 18);
    ctx.fillStyle = '#92400E';
    ctx.fillText(badge, bx + 8, 31);
  }
}

/** Separator + citation (left) + logo (right). Returns nothing. */
export function drawCardFooter(ctx: CanvasRenderingContext2D, w: number, footerY: number, caption: string) {
  ctx.strokeStyle = SC.border;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(20, footerY);
  ctx.lineTo(w - 20, footerY);
  ctx.stroke();

  ctx.fillStyle = SC.faint;
  ctx.font = `400 9px ${SC.FONT}`;
  ctx.fillText(caption, 20, footerY + 20);

  if (logoLoaded && cachedLogo) {
    const logoH = 16;
    const logoW = (cachedLogo.naturalWidth / cachedLogo.naturalHeight) * logoH;
    ctx.drawImage(cachedLogo, w - 20 - logoW, footerY + 8, logoW, logoH);
  }
}

export function footerCaption(view: string): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `Source: clarisix.com  ·  ${view}  ·  Generated ${date}`;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyCanvas(canvas: HTMLCanvasElement, filename: string): Promise<'clipboard' | 'download'> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('no clipboard image support');
    // Hand ClipboardItem a Blob *promise* synchronously so the async PNG encode
    // happens inside the user-gesture window — awaiting toBlob first would void
    // the gesture and Chromium/Safari reject the write (NotAllowedError).
    const blobPromise = new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png'),
    );
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
    return 'clipboard';
  } catch {
    downloadCanvas(canvas, filename);
    return 'download';
  }
}
