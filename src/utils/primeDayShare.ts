// ─── Prime Day Recap — branded share canvases ────────────────────────────────
// Two "principal views" exportable as branded PNGs: the YoY summary and the
// top-movers board. Both carry the Clarisix logo + citation footer.

import {
  primeDayMeta, primeDayMetrics, primeDayRevenue, primeDayDays,
  metricChange, fmtMetricValue, pctDelta,
  type MoverDimension,
} from '../data/primeDayData';
import { makeCanvas, drawCardHeader, drawCardFooter, footerCaption, SC } from './brandedShare';

const byKey = new Map(primeDayMetrics.map((m) => [m.key, m]));
const TILE_KEYS = ['units', 'orders', 'aov', 'cvr', 'ntb', 'adSales', 'acos'];

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
    'ATTRIBUTION PENDING',
  );

  // ── Headline revenue ──
  const rev = primeDayRevenue;
  const revPct = pctDelta(rev.thisYear, rev.lastYear);
  const revAbs = rev.thisYear - rev.lastYear;
  ctx.fillStyle = SC.faint; ctx.font = `700 10px ${SC.FONT}`;
  ctx.fillText('PRIME DAY SALES', pad, 82);

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

// ── YoY KPI comparison table (the "This year vs last year" card) ──────────────
const KPI_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Headline', keys: ['revenue'] },
  { label: 'Demand & volume', keys: ['units', 'orders', 'aov', 'glance', 'cvr'] },
  { label: 'Advertising — provisional (attribution settling)', keys: ['adSpend', 'adSales', 'acos', 'roas', 'tacos'] },
  { label: 'Customer & profit', keys: ['ntb', 'discount', 'margin'] },
];

export function buildKpiTableCanvas(currency: string): HTMLCanvasElement {
  const W = 760, pad = 24;
  const rowH = 22, groupH = 26, colHeaderTop = 92;
  const totalRows = KPI_GROUPS.reduce((s, g) => s + g.keys.length, 0);
  const bodyH = KPI_GROUPS.length * groupH + totalRows * rowH;
  const H = colHeaderTop + 16 + bodyH + 52;
  const { canvas, ctx } = makeCanvas(W, H);

  drawCardHeader(
    ctx, W, pad, 'Prime Day 2026 — This year vs last year',
    `${primeDayMeta.thisYearLabel} (${primeDayMeta.thisYearDates})  vs  ${primeDayMeta.lastYearLabel} (${primeDayMeta.lastYearDates})`,
  );

  // Column right edges
  const yoyR = W - pad;
  const lyR = W - pad - 130;
  const tyR = W - pad - 270;
  const right = (text: string, r: number, y: number) => ctx.fillText(text, r - ctx.measureText(text).width, y);

  // Column headers
  ctx.fillStyle = SC.faint; ctx.font = `700 9px ${SC.FONT}`;
  ctx.fillText('METRIC', pad, colHeaderTop);
  right(primeDayMeta.thisYearLabel.toUpperCase(), tyR, colHeaderTop);
  right(primeDayMeta.lastYearLabel.toUpperCase(), lyR, colHeaderTop);
  right('YOY', yoyR, colHeaderTop);
  ctx.strokeStyle = SC.border; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(pad, colHeaderTop + 8); ctx.lineTo(W - pad, colHeaderTop + 8); ctx.stroke();

  let y = colHeaderTop + 16;
  KPI_GROUPS.forEach((g) => {
    // group band
    ctx.fillStyle = SC.tileBg; ctx.fillRect(pad, y, W - pad * 2, groupH);
    ctx.fillStyle = SC.sub; ctx.font = `800 9px ${SC.FONT}`;
    ctx.fillText(g.label.toUpperCase(), pad + 6, y + 17);
    y += groupH;

    g.keys.forEach((key) => {
      const m = byKey.get(key);
      if (!m) return;
      const ch = metricChange(m);
      ctx.fillStyle = SC.ink; ctx.font = `${key === 'revenue' ? 700 : 500} 12px ${SC.FONT}`;
      ctx.fillText(m.label, pad + 6, y + 15);

      ctx.fillStyle = SC.ink; ctx.font = `700 12px ${SC.FONT}`;
      right(fmtMetricValue(m.unit, m.thisYear, currency), tyR, y + 15);
      ctx.fillStyle = SC.sub; ctx.font = `400 12px ${SC.FONT}`;
      right(fmtMetricValue(m.unit, m.lastYear, currency), lyR, y + 15);

      ctx.fillStyle = ch.positive === null ? SC.neutralText : ch.positive ? SC.greenText : SC.redText;
      ctx.font = `700 12px ${SC.FONT}`;
      right(ch.deltaText, yoyR, y + 15);

      ctx.strokeStyle = SC.track; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad, y + rowH); ctx.lineTo(W - pad, y + rowH); ctx.stroke();
      y += rowH;
    });
  });

  drawCardFooter(ctx, W, H - 34, footerCaption('Prime Day Recap · YoY KPIs'));
  return canvas;
}

// ── Revenue by event day — each day vs its last-year peer ─────────────────────
export function buildRevenueByDayCanvas(currency: string): HTMLCanvasElement {
  const W = 760, pad = 24, H = 392;
  const { canvas, ctx } = makeCanvas(W, H);

  drawCardHeader(
    ctx, W, pad, 'Prime Day 2026 — Sales by event day',
    `${primeDayMeta.thisYearLabel} (${primeDayMeta.thisYearDates})  vs  ${primeDayMeta.lastYearLabel} (${primeDayMeta.lastYearDates}), day for day`,
  );

  const plotLeft = pad, plotRight = W - pad;
  const plotW = plotRight - plotLeft;
  const chartTop = 118, chartBottom = H - 96;
  const chartH = chartBottom - chartTop;
  const maxVal = Math.max(...primeDayDays.flatMap((d) => [d.thisYear, d.lastYear])) * 1.18;
  const slotW = plotW / primeDayDays.length;
  const barW = Math.min(46, slotW * 0.26);

  // baseline
  ctx.strokeStyle = SC.border; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(plotLeft, chartBottom); ctx.lineTo(plotRight, chartBottom); ctx.stroke();

  primeDayDays.forEach((d, i) => {
    const cx = plotLeft + slotW * i + slotW / 2;
    const lyH = (d.lastYear / maxVal) * chartH;
    const tyH = (d.thisYear / maxVal) * chartH;
    const lyX = cx - barW - 4;
    const tyX = cx + 4;
    const pct = pctDelta(d.thisYear, d.lastYear);

    // last year (slate) then this year (brand)
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(lyX, chartBottom - lyH, barW, lyH);
    ctx.fillStyle = SC.cx;
    ctx.fillRect(tyX, chartBottom - tyH, barW, tyH);

    // value labels above each bar
    ctx.font = `700 10px ${SC.FONT}`;
    ctx.fillStyle = SC.faint;
    const lyLbl = fmtMetricValue('currency', d.lastYear, currency);
    ctx.fillText(lyLbl, lyX + barW / 2 - ctx.measureText(lyLbl).width / 2, chartBottom - lyH - 6);
    ctx.fillStyle = SC.cx;
    const tyLbl = fmtMetricValue('currency', d.thisYear, currency);
    ctx.fillText(tyLbl, tyX + barW / 2 - ctx.measureText(tyLbl).width / 2, chartBottom - tyH - 6);

    // YoY % centered over the pair
    ctx.fillStyle = pct >= 0 ? SC.greenText : SC.redText;
    ctx.font = `800 11px ${SC.FONT}`;
    const g = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    ctx.fillText(g, cx - ctx.measureText(g).width / 2, chartTop - 6);

    // day label + date pair below baseline
    const [dayShort, datePair] = d.label.split('·').map((s) => s.trim());
    ctx.fillStyle = SC.ink; ctx.font = `700 11px ${SC.FONT}`;
    ctx.fillText(dayShort, cx - ctx.measureText(dayShort).width / 2, chartBottom + 18);
    if (datePair) {
      ctx.fillStyle = SC.faint; ctx.font = `400 8.5px ${SC.FONT}`;
      const dp = truncate(ctx, datePair, slotW - 10);
      ctx.fillText(dp, cx - ctx.measureText(dp).width / 2, chartBottom + 31);
    }
  });

  // legend
  const lgY = H - 50;
  ctx.fillStyle = SC.cx; ctx.fillRect(pad, lgY, 10, 10);
  ctx.fillStyle = SC.sub; ctx.font = `600 10px ${SC.FONT}`;
  ctx.fillText(primeDayMeta.thisYearLabel, pad + 16, lgY + 9);
  const offset = pad + 16 + ctx.measureText(primeDayMeta.thisYearLabel).width + 18;
  ctx.fillStyle = '#CBD5E1'; ctx.fillRect(offset, lgY, 10, 10);
  ctx.fillStyle = SC.sub;
  ctx.fillText(primeDayMeta.lastYearLabel, offset + 16, lgY + 9);

  drawCardFooter(ctx, W, H - 30, footerCaption('Prime Day Recap · Sales by day'));
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
