import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Download, Image } from 'lucide-react';
import { periodSnapshots } from '../data/dashboardData';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';

const KPI_KEYS = ['Sales', 'TACOS', 'Profitability', 'Out of Stock', 'Content Score', 'Customer Experience'] as const;
const PCT_KPIS = new Set(['TACOS', 'Out of Stock']);

const NAV_MAP: Record<string, { section: string; sub: string }> = {
  Sales: { section: 'Sales', sub: 'Overview' },
  TACOS: { section: 'Advertising', sub: 'Overview' },
  Profitability: { section: 'Profitability', sub: 'Overview' },
  'Out of Stock': { section: 'Inventory', sub: 'Overview' },
  'Content Score': { section: 'Content', sub: 'Content App Tracking' },
  'Customer Experience': { section: 'Customer Experience', sub: 'Ratings and Reviews' },
};

interface PeriodSnapshotProps {
  onCardClick?: (section: string, sub: string) => void;
}

function getCellColors(positive: boolean) {
  return positive
    ? { bg: 'bg-green-50/80', text: 'text-green-900', change: 'text-green-700', border: 'border-green-100' }
    : { bg: 'bg-red-50/80', text: 'text-red-900', change: 'text-red-600', border: 'border-red-100' };
}

/* ── Pre-load logo once at module level ─────────────────── */

let cachedLogo: HTMLImageElement | null = null;
let logoLoaded = false;

function preloadLogo(): Promise<void> {
  if (logoLoaded && cachedLogo) return Promise.resolve();
  return new Promise((resolve) => {
    cachedLogo = new window.Image();
    cachedLogo.onload = () => { logoLoaded = true; resolve(); };
    cachedLogo.onerror = () => { logoLoaded = false; resolve(); };
    cachedLogo.src = '/clarisix_logo_orange.png';
  });
}

/* ── Pure Canvas renderer ────────────────────────────────── */

const C = {
  greenBg: '#F0FDF4', greenText: '#14532D', greenChange: '#15803D',
  redBg: '#FEF2F2', redText: '#7F1D1D', redChange: '#DC2626',
  neutralBg: '#F9FAFB', neutralText: '#1F2937', neutralChange: '#9CA3AF',
  headerBg: '#F9FAFB', headerText: '#0E5A8A', headerSub: '#9CA3AF',
  labelText: '#4B5563', border: '#E5E7EB', white: '#FFFFFF',
  gray500: '#6B7280', gray400: '#9CA3AF',
};

function drawBrandedSnapshot(
  currency: string,
  formatCurrency: (v: number, c: string) => string,
): HTMLCanvasElement {
  const scale = 2;
  const labelColW = 130;
  const cellW = 150;
  const headerH = 48;
  const rowH = 46;
  const footerH = 48;
  const pad = 20;

  const tableW = labelColW + cellW * periodSnapshots.length;
  const tableH = headerH + rowH * KPI_KEYS.length;
  const canvasW = tableW + pad * 2;
  const canvasH = tableH + pad * 2 + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * scale;
  canvas.height = canvasH * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const x0 = pad;
  const y0 = pad;

  // White background
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Table border (simple rect, no roundRect)
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, tableW, tableH);

  // Clip to table bounds
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, tableW, tableH);
  ctx.clip();

  // Header row background
  ctx.fillStyle = C.headerBg;
  ctx.fillRect(x0, y0, tableW, headerH);

  // Header bottom border
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0 + headerH);
  ctx.lineTo(x0 + tableW, y0 + headerH);
  ctx.stroke();

  // Label column background in header
  ctx.fillStyle = C.headerBg;
  ctx.fillRect(x0, y0, labelColW, headerH);

  // Column headers
  periodSnapshots.forEach((period, i) => {
    const cx = x0 + labelColW + i * cellW;

    // Vertical separator (full height)
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, y0);
    ctx.lineTo(cx, y0 + tableH);
    ctx.stroke();

    ctx.fillStyle = C.headerText;
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText(period.label, cx + 10, y0 + 20);
    ctx.fillStyle = C.headerSub;
    ctx.font = '400 9px Inter, system-ui, sans-serif';
    ctx.fillText(period.sublabel, cx + 10, y0 + 34);
  });

  // Separator after label column
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x0 + labelColW, y0);
  ctx.lineTo(x0 + labelColW, y0 + tableH);
  ctx.stroke();

  // Data rows
  KPI_KEYS.forEach((kpi, kpiIdx) => {
    const ry = y0 + headerH + kpiIdx * rowH;

    // Row border
    if (kpiIdx < KPI_KEYS.length - 1) {
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, ry + rowH);
      ctx.lineTo(x0 + tableW, ry + rowH);
      ctx.stroke();
    }

    // Label cell
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(x0, ry, labelColW, rowH);
    ctx.fillStyle = C.labelText;
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(kpi, x0 + 10, ry + rowH / 2 + 4);

    // Data cells
    periodSnapshots.forEach((period, colIdx) => {
      const cx = x0 + labelColW + colIdx * cellW;
      const metric = period.metrics[kpi];
      if (!metric) return;

      const isNeutral = metric.change === 0;
      const isPositive = metric.changePositive ?? true;

      // Cell background
      ctx.fillStyle = isNeutral ? C.neutralBg : isPositive ? C.greenBg : C.redBg;
      ctx.fillRect(cx, ry, cellW, rowH);

      // Value
      const displayValue = metric.rawValue !== undefined
        ? formatCurrency(metric.rawValue, currency)
        : String(metric.value);
      ctx.fillStyle = isNeutral ? C.neutralText : isPositive ? C.greenText : C.redText;
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.fillText(displayValue, cx + 10, ry + 20);

      // Change %
      if (metric.change !== undefined) {
        const changeSuffix = PCT_KPIS.has(kpi) ? 'pp' : '%';
        const changeStr = `${metric.change > 0 ? '+' : ''}${metric.change}${changeSuffix}`;
        ctx.fillStyle = isNeutral ? C.neutralChange : isPositive ? C.greenChange : C.redChange;
        ctx.font = '600 10px Inter, system-ui, sans-serif';
        ctx.fillText(changeStr, cx + 10, ry + 36);
      }
    });
  });

  ctx.restore(); // un-clip

  // ── Branded footer (McKinsey-style citation) ──
  const footerY = y0 + tableH + 14;

  // Thin separator line
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(pad, footerY);
  ctx.lineTo(canvasW - pad, footerY);
  ctx.stroke();

  // Citation text (left)
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '400 9px Inter, system-ui, sans-serif';
  ctx.fillText(`Source: clarisix.com  |  Data generated ${dateStr}`, pad, footerY + 22);

  // Logo (right)
  if (logoLoaded && cachedLogo) {
    const logoH = 16;
    const logoW = (cachedLogo.naturalWidth / cachedLogo.naturalHeight) * logoH;
    ctx.drawImage(cachedLogo, canvasW - pad - logoW, footerY + 10, logoW, logoH);
  }

  return canvas;
}

/* ── Component ───────────────────────────────────────────── */

export default function PeriodSnapshot({ onCardClick }: PeriodSnapshotProps) {
  const { currency } = useCurrency();
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Pre-load logo on mount so it's ready when user clicks share
  useEffect(() => { preloadLogo(); }, []);

  const handleDownload = useCallback(async () => {
    setSharing(true);
    try {
      await preloadLogo();
      const canvas = drawBrandedSnapshot(currency, fc);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `clarisix-snapshot-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShareSuccess('download');
    } catch (e) {
      console.error('Snapshot download failed:', e);
    } finally {
      setSharing(false);
      setTimeout(() => setShareSuccess(null), 3000);
    }
  }, [currency]);

  const handleCopyImage = useCallback(async () => {
    setSharing(true);
    try {
      await preloadLogo();
      const canvas = drawBrandedSnapshot(currency, fc);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) throw new Error('toBlob returned null');

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setShareSuccess('clipboard');
    } catch (e) {
      console.error('Clipboard copy failed, falling back to download:', e);
      // Fallback: trigger download instead
      try {
        const canvas = drawBrandedSnapshot(currency, fc);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `clarisix-snapshot-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShareSuccess('download');
      } catch (e2) {
        console.error('Fallback download also failed:', e2);
      }
    } finally {
      setSharing(false);
      setTimeout(() => setShareSuccess(null), 3000);
    }
  }, [currency]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Period Snapshot</h3>
        <div className="flex items-center gap-1">
          {shareSuccess && (
            <span className="text-[11px] text-green-600 font-medium mr-1 animate-fade-slide-in">
              {shareSuccess === 'clipboard' ? 'Copied to clipboard!' : 'Image saved!'}
            </span>
          )}
          <button
            onClick={handleCopyImage}
            disabled={sharing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-cx-600 hover:bg-cx-50 rounded-md transition-all disabled:opacity-50"
            title="Copy as branded image"
          >
            <Image className="w-3.5 h-3.5" />
            {sharing ? 'Generating...' : 'Copy image'}
          </button>
          <button
            onClick={handleDownload}
            disabled={sharing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-cx-600 hover:bg-cx-50 rounded-md transition-all disabled:opacity-50"
            title="Download branded PNG"
          >
            <Download className="w-3.5 h-3.5" />
            Save PNG
          </button>
        </div>
      </div>

      {/* Table content */}
      <div>
        {/* Column headers */}
        <div className="grid grid-cols-[130px_repeat(5,1fr)]">
          <div className="p-2.5 bg-gray-50/50" />
          {periodSnapshots.map((period) => (
            <div
              key={period.label}
              className="p-2.5 border-l border-gray-100 bg-gray-50/50"
            >
              <p className="text-[11px] font-bold text-cx-700 leading-tight">{period.label}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{period.sublabel}</p>
            </div>
          ))}
        </div>

        {/* Metric rows */}
        {KPI_KEYS.map((kpi, kpiIdx) => {
          const nav = NAV_MAP[kpi];
          const isLast = kpiIdx === KPI_KEYS.length - 1;

          return (
            <div
              key={kpi}
              className={`grid grid-cols-[130px_repeat(5,1fr)] ${!isLast ? 'border-b border-gray-100/60' : ''}`}
            >
              <div
                className="p-2.5 flex items-center justify-between cursor-pointer group/label bg-gray-50/30 border-r border-gray-100"
                onClick={() => onCardClick?.(nav.section, nav.sub)}
              >
                <span className="text-[11px] font-semibold text-gray-600 group-hover/label:text-cx-600 transition-colors">
                  {kpi}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover/label:opacity-100 group-hover/label:text-cx-400 transition-all" />
              </div>

              {periodSnapshots.map((period) => {
                const metric = period.metrics[kpi];
                if (!metric) return <div key={period.label} className="p-2.5 border-l border-gray-100" />;

                const isPositive = metric.changePositive ?? true;
                const isNeutral = metric.change === 0;
                const colors = isNeutral
                  ? { bg: 'bg-gray-50/40', text: 'text-gray-800', change: 'text-gray-400', border: 'border-gray-100' }
                  : getCellColors(isPositive);

                const displayValue = metric.rawValue !== undefined
                  ? fc(metric.rawValue, currency)
                  : metric.value;

                const changeSuffix = PCT_KPIS.has(kpi) ? 'pp' : '%';
                const changeStr = metric.change !== undefined
                  ? `${metric.change > 0 ? '+' : ''}${metric.change}${changeSuffix}`
                  : '';

                return (
                  <div
                    key={period.label}
                    className={`p-2.5 border-l ${colors.border} ${colors.bg} transition-colors`}
                  >
                    <span className={`text-sm font-bold ${colors.text} tabular-nums leading-tight`}>
                      {displayValue}
                    </span>
                    {changeStr && (
                      <p className={`text-[10px] font-semibold tabular-nums mt-0.5 ${colors.change}`}>
                        {changeStr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
