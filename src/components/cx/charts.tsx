import { useState } from 'react';

// round a max up to a clean 1/2/5×10ⁿ so axis labels read $20 / $40, not $24.44
const niceCeil = (v: number): number => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10; return m * p; };

export interface Series { key: string; label: string; color: string }
type Row = { label: string } & Record<string, number>;

/** Stacked columns — the simplest read of a mix over time. Hover shows values + %; a
 *  dashed divider separates the previous and current comparison halves. Legend below. */
export function StackedBars({ points, segments, splitIndex, fmt, height = 300, showPct = true }: {
  points: Row[]; segments: Series[]; splitIndex?: number; fmt: (v: number) => string; height?: number; showPct?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 820, H = height, padL = 48, padR = 14, padT = 18, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = points.length, colW = plotW / n, barW = Math.min(34, colW * 0.66);
  const cx = (i: number) => padL + colW * (i + 0.5);
  const totals = points.map((p) => segments.reduce((s, seg) => s + (p[seg.key] || 0), 0));
  const yMax = niceCeil(Math.max(1, ...totals));
  const y = (v: number) => padT + (1 - v / yMax) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full" onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}><line x1={padL} y1={y(yMax * f)} x2={padL + plotW} y2={y(yMax * f)} stroke="#F1F5F9" /><text x={padL - 8} y={y(yMax * f) + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{fmt(yMax * f)}</text></g>
        ))}
        {splitIndex != null && (
          <g><line x1={padL + colW * splitIndex} y1={padT} x2={padL + colW * splitIndex} y2={padT + plotH} stroke="#CBD5E1" strokeDasharray="3 3" />
            <text x={padL + colW * splitIndex - 5} y={padT + 8} textAnchor="end" fontSize="8" fontWeight="600" fill="#94A3B8">PREVIOUS</text>
            <text x={padL + colW * splitIndex + 5} y={padT + 8} textAnchor="start" fontSize="8" fontWeight="600" fill="#64748B">CURRENT</text></g>
        )}
        {points.map((p, i) => {
          let acc = 0; const dim = hover != null && hover !== i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={cx(i) - colW / 2} y={padT} width={colW} height={plotH} fill="transparent" />
              {segments.map((seg) => {
                const v = p[seg.key] || 0; const yTop = y(acc + v); const h = Math.max(0, y(acc) - yTop); acc += v;
                const pctv = totals[i] ? (v / totals[i]) * 100 : 0;
                return (
                  <g key={seg.key}>
                    <rect x={cx(i) - barW / 2} y={yTop} width={barW} height={h} fill={seg.color} fillOpacity={dim ? 0.35 : 1} />
                    {showPct && h > 13 && <text x={cx(i)} y={yTop + h / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="white" opacity={dim ? 0.5 : 1}>{pctv.toFixed(0)}%</text>}
                  </g>
                );
              })}
            </g>
          );
        })}
        {points.map((p, i) => (i % 2 === 0 ? <text key={i} x={cx(i)} y={H - 8} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{p.label}</text> : null))}
      </svg>
      {hover != null && (
        <div className="absolute -top-1 pointer-events-none" style={{ left: `${(cx(hover) / W) * 100}%`, transform: 'translate(-50%,-100%)' }}>
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 text-[11px] w-max">
            <div className="font-bold mb-1">{points[hover].label}</div>
            {segments.slice().reverse().map((seg) => { const v = points[hover][seg.key] || 0; const pctShare = totals[hover] ? (v / totals[hover]) * 100 : 0; return (
              <div key={seg.key} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: seg.color }} /><span className="text-gray-300">{seg.label}</span><span className="ml-auto font-semibold tabular-nums">{fmt(v)} · {pctShare.toFixed(0)}%</span></div>); })}
            <div className="flex items-center gap-2 pt-0.5 border-t border-white/10 mt-1"><span className="text-gray-400">Total</span><span className="ml-auto font-bold tabular-nums">{fmt(totals[hover])}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One-question stacked-area trend, optional right-axis % line, hover tooltip,
 *  a Previous|Current comparison divider and direct end-of-series labels. */
export function TrendChart({ points, areas, line, height = 300, fmtLeft, fmtRight, splitIndex, showTotal = true }: {
  points: Row[];
  areas: Series[];
  line?: Series;
  height?: number;
  fmtLeft: (v: number) => string;
  fmtRight?: (v: number) => string;
  splitIndex?: number;       // divider between previous and current halves
  showTotal?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 860, H = height, padL = 52, padR = line ? 52 : 82, padT = 22, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = points.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;

  const totals = points.map((p) => areas.reduce((s, a) => s + (p[a.key] || 0), 0));
  const yMax = Math.max(1, ...totals) * 1.08;
  const y = (v: number) => padT + (1 - v / yMax) * plotH;

  const rMax = line ? Math.max(1, ...points.map((p) => p[line.key] || 0)) * 1.15 : 1;
  const ry = (v: number) => padT + (1 - v / rMax) * plotH;

  // stacked area paths (first area at the bottom)
  const cum = points.map(() => 0);
  const areaPaths = areas.map((a) => {
    const lower = points.map((_, i) => cum[i]);
    points.forEach((p, i) => (cum[i] += p[a.key] || 0));
    const upper = points.map((_, i) => cum[i]);
    const top = upper.map((v, i) => `${x(i)},${y(v)}`).join(' L ');
    const bot = lower.map((v, i) => `${x(i)},${y(v)}`).reverse().join(' L ');
    return { a, d: `M ${top} L ${bot} Z`, topLine: upper.map((v, i) => `${x(i)},${y(v)}`).join(' L '), endY: y(upper[n - 1]), endMid: y((upper[n - 1] + lower[n - 1]) / 2) };
  });

  const linePath = line ? points.map((p, i) => `${x(i)},${ry(p[line.key] || 0)}`).join(' L ') : '';

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(n - 1, Math.round(((px - padL) / plotW) * (n - 1)))));
        }}>
        {/* left gridlines */}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padL} y1={y(yMax * f)} x2={padL + plotW} y2={y(yMax * f)} stroke="#F1F5F9" strokeWidth={1} />
            <text x={padL - 8} y={y(yMax * f) + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{fmtLeft(yMax * f)}</text>
          </g>
        ))}
        {line && fmtRight && [0, 0.5, 1].map((f) => (
          <text key={f} x={padL + plotW + 8} y={ry(rMax * f) + 3} textAnchor="start" fontSize="9" fill={line.color}>{fmtRight(rMax * f)}</text>
        ))}

        {/* comparison divider */}
        {splitIndex != null && (
          <g>
            <line x1={x(splitIndex)} y1={padT} x2={x(splitIndex)} y2={padT + plotH} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 3" />
            <text x={x(splitIndex) - 6} y={padT + 9} textAnchor="end" fontSize="8" fontWeight="600" fill="#94A3B8">PREVIOUS</text>
            <text x={x(splitIndex) + 6} y={padT + 9} textAnchor="start" fontSize="8" fontWeight="600" fill="#64748B">CURRENT</text>
          </g>
        )}

        {/* stacked areas */}
        {areaPaths.map(({ a, d, topLine }) => (
          <g key={a.key}>
            <path d={d} fill={a.color} fillOpacity={0.16} />
            <path d={`M ${topLine}`} fill="none" stroke={a.color} strokeWidth={2} strokeLinejoin="round" />
          </g>
        ))}
        {/* end-of-series labels (direct annotation, no detached legend) */}
        {areaPaths.map(({ a, endMid }) => (
          <text key={a.key} x={padL + plotW + 4} y={endMid + 3} textAnchor="start" fontSize="9.5" fontWeight="700" fill={a.color}>{line ? '' : a.label}</text>
        ))}

        {/* right-axis line */}
        {line && <path d={`M ${linePath}`} fill="none" stroke={line.color} strokeWidth={2} strokeDasharray="1 0" strokeLinejoin="round" />}

        {/* x labels (every other) */}
        {points.map((p, i) => (i % 2 === 0 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{p.label}</text> : null))}

        {/* hover crosshair + markers */}
        {hover != null && (
          <g>
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + plotH} stroke="#0F172A" strokeOpacity={0.12} strokeWidth={1} />
            {(() => { let acc = 0; return areas.map((a) => { acc += points[hover][a.key] || 0; return <circle key={a.key} cx={x(hover)} cy={y(acc)} r={3} fill="white" stroke={a.color} strokeWidth={2} />; }); })()}
            {line && <circle cx={x(hover)} cy={ry(points[hover][line.key] || 0)} r={3} fill="white" stroke={line.color} strokeWidth={2} />}
          </g>
        )}
      </svg>

      {/* tooltip */}
      {hover != null && (
        <div className="absolute -top-1 pointer-events-none" style={{ left: `${(x(hover) / W) * 100}%`, transform: 'translate(-50%,-100%)' }}>
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 text-[11px] w-max">
            <div className="font-bold mb-1">{points[hover].label}</div>
            <div className="space-y-0.5">
              {areas.map((a) => (
                <div key={a.key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-gray-300">{a.label}</span>
                  <span className="ml-auto font-semibold tabular-nums">{fmtLeft(points[hover][a.key] || 0)}</span>
                </div>
              ))}
              {line && fmtRight && (
                <div className="flex items-center gap-2 pt-0.5 border-t border-white/10 mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: line.color }} />
                  <span className="text-gray-300">{line.label}</span>
                  <span className="ml-auto font-semibold tabular-nums">{fmtRight(points[hover][line.key] || 0)}</span>
                </div>
              )}
              {showTotal && (
                <div className="flex items-center gap-2 pt-0.5 border-t border-white/10 mt-1">
                  <span className="text-gray-400">Total</span>
                  <span className="ml-auto font-bold tabular-nums">{fmtLeft(totals[hover])}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Cohort curves (decision mode): recent vs strong vs benchmark, with an immature dashed tail. */
export function CohortCurveChart({ months, series, matureFrom, fmt, height = 300, xLabel }: {
  months: number[];
  series: { label: string; color: string; values: (number | null)[]; emphasis?: boolean }[];
  matureFrom?: number;
  fmt: (v: number) => string;
  height?: number;
  xLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 820, H = height, padL = 50, padR = 150, padT = 20, padB = xLabel ? 46 : 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = months.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  const yMax = niceCeil(Math.max(1, ...all)), yMin = Math.min(0, ...all) < 0 ? -niceCeil(-Math.min(...all)) : 0;
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n - 1, Math.round(((px - padL) / plotW) * (n - 1))))); }}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}><line x1={padL} y1={padT + f * plotH} x2={padL + plotW} y2={padT + f * plotH} stroke="#F1F5F9" /><text x={padL - 8} y={padT + f * plotH + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{fmt(yMax - f * (yMax - yMin))}</text></g>
        ))}
        {yMin < 0 && <line x1={padL} y1={y(0)} x2={padL + plotW} y2={y(0)} stroke="#E2E8F0" strokeDasharray="2 2" />}
        {/* marker where the recent cohort's real data ends — no fabricated tail beyond it */}
        {matureFrom != null && matureFrom < n - 1 && (
          <g><line x1={x(matureFrom)} y1={padT} x2={x(matureFrom)} y2={padT + plotH} stroke="#E2E8F0" strokeDasharray="2 3" /><text x={x(matureFrom) + 4} y={padT + 8} textAnchor="start" fontSize="7.5" fill="#CBD5E1">recent cohort matured to here</text></g>
        )}
        {series.map((s) => {
          // solid over real (non-null) data only; a cohort simply ends where its maturity does
          const pts = s.values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' L ');
          const lastI = s.values.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).pop() ?? 0;
          return (
            <g key={s.label}>
              {pts && <path d={`M ${pts}`} fill="none" stroke={s.color} strokeWidth={s.emphasis ? 2.75 : 2} strokeLinejoin="round" strokeLinecap="round" />}
              <text x={x(lastI) + 6} y={y(s.values[lastI] as number) + 3} fontSize="9.5" fontWeight={s.emphasis ? 800 : 600} fill={s.color}>{s.label}</text>
            </g>
          );
        })}
        {months.map((m, i) => (i % 2 === 0 ? <text key={i} x={x(i)} y={padT + plotH + 15} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{m}</text> : null))}
        {xLabel && <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748B">{xLabel}</text>}
        {hover != null && <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + plotH} stroke="#0F172A" strokeOpacity={0.12} />}
        {hover != null && series.map((s) => (s.values[hover] == null ? null : <circle key={s.label} cx={x(hover)} cy={y(s.values[hover] as number)} r={3} fill="white" stroke={s.color} strokeWidth={2} />))}
      </svg>
      {hover != null && (
        <div className="absolute -top-1 pointer-events-none" style={{ left: `${(x(hover) / W) * 100}%`, transform: 'translate(-50%,-100%)' }}>
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 text-[11px] w-max">
            <div className="font-bold mb-1">Month {months[hover]}</div>
            {series.map((s) => (
              <div key={s.label} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} /><span className="text-gray-300">{s.label}</span><span className="ml-auto font-semibold tabular-nums">{s.values[hover] == null ? 'not matured' : fmt(s.values[hover] as number)}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
