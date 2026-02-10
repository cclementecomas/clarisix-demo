import { useState, useCallback } from 'react';
import { X, Download, EyeOff, Eye } from 'lucide-react';
import { kpiData } from '../data/dashboardData';

const SCORE = 74;
const RADIUS = 70;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CARD_W = 1200;
const CARD_H = 630;
const PREVIEW_W = 600;
const SCALE = PREVIEW_W / CARD_W;

interface Props {
  open: boolean;
  onClose: () => void;
}

function drawCardToCanvas(hideNumbers: boolean): HTMLCanvasElement {
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W * dpr;
  canvas.height = CARD_H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(1, '#EEF2F6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const glowGrad = ctx.createRadialGradient(CARD_W - 100, -50, 0, CARD_W - 100, -50, 350);
  glowGrad.addColorStop(0, 'rgba(14, 90, 138, 0.04)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const px = 56;
  const py = 48;

  ctx.beginPath();
  ctx.roundRect(px, py, 44, 44, 10);
  const logoGrad = ctx.createLinearGradient(px, py, px + 44, py + 44);
  logoGrad.addColorStop(0, '#4B9DCC');
  logoGrad.addColorStop(1, '#0E5A8A');
  ctx.fillStyle = logoGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', px + 22, py + 23);

  ctx.fillStyle = '#0B1220';
  ctx.font = '700 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Clarisix', px + 58, py + 22);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Performance Scorecard', CARD_W - px, py + 22);

  const ringCx = px + 110;
  const ringCy = CARD_H / 2 + 16;
  const ringR = RADIUS;

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = STROKE_WIDTH;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (SCORE / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, startAngle, endAngle);
  ctx.strokeStyle = '#0E5A8A';
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = '#0E5A8A';
  ctx.font = '700 56px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${SCORE}`, ringCx, ringCy - 6);

  const scoreLabel = SCORE >= 70 ? 'Good' : SCORE >= 50 ? 'Average' : 'Needs Work';
  ctx.fillStyle = '#4B9DCC';
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillText(scoreLabel, ringCx, ringCy + 34);

  const gridLeft = px + 220 + 56;
  const gridTop = py + 68;
  const cols = 3;
  const tileGap = 12;
  const tileW = (CARD_W - gridLeft - px - tileGap * (cols - 1)) / cols;
  const tileH = (CARD_H - gridTop - py - 40 - tileGap) / 2;

  kpiData.forEach((kpi, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tx = gridLeft + col * (tileW + tileGap);
    const ty = gridTop + row * (tileH + tileGap);

    const isPositive = kpi.popPositive;
    const bgColor = isPositive ? '#F0FDF4' : '#fef2f2';
    const borderColor = isPositive ? '#A8D4EC' : '#fecaca';

    ctx.beginPath();
    ctx.roundRect(tx, ty, tileW, tileH, 14);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const labelColor = isPositive ? '#166534' : '#991B1B';
    ctx.fillStyle = labelColor;
    ctx.font = '700 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(kpi.label.toUpperCase(), tx + 20, ty + 18);

    const valueColor = isPositive ? '#052E16' : '#7f1d1d';
    ctx.fillStyle = hideNumbers ? '#9ca3af' : valueColor;
    ctx.font = '700 24px Inter, system-ui, sans-serif';
    ctx.fillText(hideNumbers ? '\u2022\u2022\u2022' : kpi.value, tx + 20, ty + 40);

    ctx.fillStyle = '#6b7280';
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    ctx.fillText('PoP', tx + 20, ty + 74);

    const popArrow = kpi.popPositive ? '\u25B2' : '\u25BC';
    const popColor = kpi.popPositive ? '#166534' : '#991B1B';
    ctx.fillStyle = popColor;
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    const popPrefix = kpi.popChange > 0 ? '+' : '';
    ctx.fillText(`${popArrow} ${popPrefix}${kpi.popChange.toFixed(2)}%`, tx + 45, ty + 73);

    ctx.fillStyle = '#6b7280';
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    ctx.fillText('LY', tx + 20, ty + 92);

    const lyArrow = kpi.lyPositive ? '\u25B2' : '\u25BC';
    const lyColor = kpi.lyPositive ? '#166534' : '#991B1B';
    ctx.fillStyle = lyColor;
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    const lyPrefix = kpi.lyChange > 0 ? '+' : '';
    ctx.fillText(`${lyArrow} ${lyPrefix}${kpi.lyChange.toFixed(2)}%`, tx + 36, ty + 91);
  });

  const footerY = CARD_H - py;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, footerY - 20);
  ctx.lineTo(CARD_W - px, footerY - 20);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('clarisix.com', px, footerY);

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  ctx.fillStyle = '#93A4B8';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, CARD_W - px, footerY);

  return canvas;
}

function ScoreRing() {
  const offset = CIRCUMFERENCE - (SCORE / 100) * CIRCUMFERENCE;
  const label = SCORE >= 70 ? 'Good' : SCORE >= 50 ? 'Average' : 'Needs Work';

  return (
    <div style={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
      <svg width="220" height="220" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth={STROKE_WIDTH} />
        <circle
          cx="100" cy="100" r={RADIUS} fill="none"
          stroke="#0E5A8A" strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 56, fontWeight: 700, color: '#0E5A8A', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {SCORE}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#4B9DCC', marginTop: 8 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function KpiTile({ kpi, hideNumbers }: { kpi: typeof kpiData[0]; hideNumbers: boolean }) {
  const isPositive = kpi.popPositive;
  const bgColor = isPositive ? '#F0FDF4' : '#fef2f2';
  const borderColor = isPositive ? '#A8D4EC' : '#fecaca';
  const labelColor = isPositive ? '#166534' : '#991B1B';
  const valueColor = isPositive ? '#052E16' : '#7f1d1d';

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '18px 20px',
        backgroundColor: bgColor,
        border: `1.5px solid ${borderColor}`,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {kpi.label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: hideNumbers ? '#9ca3af' : valueColor, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
        {hideNumbers ? '\u2022\u2022\u2022' : kpi.value}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>PoP</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: kpi.popPositive ? '#166534' : '#991B1B' }}>
          {kpi.popPositive ? '\u25B2' : '\u25BC'} {kpi.popChange > 0 ? '+' : ''}{kpi.popChange.toFixed(2)}%
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>LY</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: kpi.lyPositive ? '#166534' : '#991B1B' }}>
          {kpi.lyPositive ? '\u25B2' : '\u25BC'} {kpi.lyChange > 0 ? '+' : ''}{kpi.lyChange.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function CardPreview({ hideNumbers }: { hideNumbers: boolean }) {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        transform: `scale(${SCALE})`,
        transformOrigin: 'top left',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #EEF2F6 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#0B1220',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          top: -150,
          right: -150,
          background: 'radial-gradient(circle, rgba(14, 90, 138, 0.04) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '48px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4B9DCC, #0E5A8A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>C</span>
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#0B1220' }}>Clarisix</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>Performance Scorecard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 56, flex: 1, marginTop: 24, marginBottom: 24 }}>
          <ScoreRing />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1 }}>
            {kpiData.map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} hideNumbers={hideNumbers} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>clarisix.com</span>
          <span style={{ fontSize: 12, color: '#93A4B8', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ShareScoreModal({ open, onClose }: Props) {
  const [hideNumbers, setHideNumbers] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const canvas = drawCardToCanvas(hideNumbers);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'clarisix-score.png';
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [hideNumbers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: PREVIEW_W + 48 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Share Score Card</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 pt-5 pb-4">
          <button
            onClick={() => setHideNumbers((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors mb-4 ${
              hideNumbers
                ? 'border-cx-300 bg-cx-50 text-cx-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {hideNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {hideNumbers ? 'Absolute Numbers Hidden' : 'Hide Absolute Numbers'}
          </button>

          <div
            className="rounded-xl overflow-hidden border border-gray-200"
            style={{ width: PREVIEW_W, height: CARD_H * SCALE }}
          >
            <CardPreview hideNumbers={hideNumbers} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-cx-500 hover:bg-cx-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating...' : 'Download Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
