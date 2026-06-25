// ─── Prime Day Recap — branded share canvases ────────────────────────────────
// Two "principal views" exportable as branded PNGs: the YoY summary and the
// top-movers board. Both carry the Clarisix logo + citation footer.

import {
  primeDayMeta, primeDayMetrics, primeDayRevenue,
  metricChange, fmtMetricValue, pctDelta,
  type MoverDimension,
} from '../data/primeDayData';
import { makeCanvas, drawCardHeader, drawCardFooter, footerCaption, SC } from './brandedShare';

const byKey = new Map(primeDayMetrics.map((m) => [m.key, m]));
const TILE_KEYS = ['units', 'orders', 'aov', 'cvr', 'ntb', 'adSales', 'acos', 'margin'];

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

export function buildSummaryCanvas(currency: string): HTMLCanvasElement {
  const W = 760, pad = 24, H = 384;
  const { canvas, ctx } = makeCanvas(W, H);

  drawCardHeader(
    ctx, W, pad, 'Prime Day 2026 — Recap',
    `${primeDayMeta.thisYearDates}  vs  ${primeDayMeta.lastYearDates} (${primeDayMeta.lastYearLabel})`,
    'LIVE · ATTRIBUTION SETTLING',
  );

  // ── Headline revenue ──
  const rev = primeDayRevenue;
  const revPct = pctDelta(rev.thisYear, rev.lastYear);
  const revAbs = rev.thisYear - rev.lastYear;
  ctx.fillStyle = SC.faint; ctx.font = `700 10px ${SC.FONT}`;
  ctx.fillText('PRIME DAY REVENUE', pad, 82);

  ctx.fillStyle = SC.ink; ctx.font = `800 32px ${SC.FONT}`;
  const revStr = fmtMetricValue('currency', rev.thisYear, currency);
  ctx.fillText(revStr, pad, 116);
  const revW = ctx.measureText(revStr).width;

  ctx.fillStyle = SC.greenText; ctx.font = `800 15px ${SC.FONT}`;
  ctx.fillText(`▲ +${revPct.toFixed(1)}%`, pad + revW + 14, 116);

  ctx.fillStyle = SC.sub; ctx.font = `400 11px ${SC.FONT}`;
  ctx.fillText(
    `vs ${fmtMetricValue('currency', rev.lastYear, currency)} last year   ·   +${fmtMetricValue('currency', revAbs, currency)} YoY`,
    pad, 136,
  );

  // ── KPI tiles (4 × 2) ──
  const contentW = W - pad * 2;
  const colW = contentW / 4;
  const tileH = 64;
  const top = 156;
  TILE_KEYS.forEach((key, i) => {
    const m = byKey.get(key);
    if (!m) return;
    const col = i % 4, row = Math.floor(i / 4);
    const x = pad + col * colW;
    const y = top + row * (tileH + 8);
    const innerW = colW - 12;
    const ch = metricChange(m);

    ctx.fillStyle = SC.tileBg; ctx.fillRect(x, y, innerW, tileH);
    ctx.strokeStyle = SC.border; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, innerW, tileH);

    ctx.fillStyle = SC.faint; ctx.font = `700 8.5px ${SC.FONT}`;
    ctx.fillText(m.label.toUpperCase(), x + 10, y + 17);

    ctx.fillStyle = SC.ink; ctx.font = `800 17px ${SC.FONT}`;
    ctx.fillText(fmtMetricValue(m.unit, m.thisYear, currency), x + 10, y + 39);

    ctx.fillStyle = ch.positive === null ? SC.neutralText : ch.positive ? SC.greenText : SC.redText;
    ctx.font = `700 10px ${SC.FONT}`;
    ctx.fillText(`${ch.deltaText} vs LY`, x + 10, y + 55);
  });

  // ── Caveat ──
  ctx.fillStyle = SC.neutralText; ctx.font = `400 9.5px ${SC.FONT}`;
  ctx.fillText('Advertising figures (ad sales, ACOS) are provisional — attribution is still settling.', pad, top + 2 * (tileH + 8) + 14);

  drawCardFooter(ctx, W, H - 34, footerCaption('Prime Day Recap'));
  return canvas;
}

export function buildMoversCanvas(dim: MoverDimension, currency: string): HTMLCanvasElement {
  const W = 760, pad = 24, H = 324;
  const { canvas, ctx } = makeCanvas(W, H);

  drawCardHeader(
    ctx, W, pad, `Prime Day 2026 — Top movers · ${dim.label}`,
    "This year's leaders vs last year's leaders, ranked by YoY growth",
  );

  const contentW = W - pad * 2;
  const colW = contentW / 2;
  const top = 76;

  const thisYear = [...dim.rows]
    .map((r) => ({ name: r.name, growth: pctDelta(r.thisYearRev, r.lastYearRev) }))
    .sort((a, b) => b.growth - a.growth).slice(0, 5);
  const lastYear = [...dim.rows]
    .map((r) => ({ name: r.name, growth: r.growthLastYear }))
    .sort((a, b) => b.growth - a.growth).slice(0, 5);

  const drawCol = (x: number, title: string, rows: { name: string; growth: number }[]) => {
    ctx.fillStyle = SC.cx; ctx.font = `800 10px ${SC.FONT}`;
    ctx.fillText(title.toUpperCase(), x, top);
    let y = top + 22;
    rows.forEach((r, i) => {
      ctx.fillStyle = SC.faint; ctx.font = `800 11px ${SC.FONT}`;
      ctx.fillText(String(i + 1), x, y + 14);
      ctx.fillStyle = SC.ink; ctx.font = `600 12px ${SC.FONT}`;
      ctx.fillText(truncate(ctx, r.name, colW - 90), x + 18, y + 14);
      const g = `${r.growth > 0 ? '+' : ''}${r.growth.toFixed(1)}%`;
      ctx.fillStyle = r.growth >= 0 ? SC.greenText : SC.redText;
      ctx.font = `700 12px ${SC.FONT}`;
      const gw = ctx.measureText(g).width;
      ctx.fillText(g, x + colW - 28 - gw, y + 14);
      // row divider
      ctx.strokeStyle = SC.track; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x + colW - 24, y + 26); ctx.stroke();
      y += 32;
    });
  };

  drawCol(pad, `${primeDayMeta.thisYearLabel} — top movers`, thisYear);
  // vertical divider
  ctx.strokeStyle = SC.border; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(pad + colW, top - 6); ctx.lineTo(pad + colW, top + 5 * 32 + 8); ctx.stroke();
  drawCol(pad + colW + 8, `${primeDayMeta.lastYearLabel} — top movers`, lastYear);

  drawCardFooter(ctx, W, H - 34, footerCaption(`Prime Day Recap · ${dim.label}`));
  return canvas;
}
