import { useRef, useState } from 'react';
import type { BrandView } from './selectors';
import type { Verdict } from '../../lib/sqp/verdict';
import { STAGE_COLOR } from '../sqpui/tokens';
import { weekLabel } from './format';

type Key = 'impShare' | 'clickShare' | 'basketShare' | 'purchShare';
const SERIES: { key: Key; label: string; color: string }[] = [
  { key: 'impShare', label: 'Impression', color: STAGE_COLOR.impressions },
  { key: 'clickShare', label: 'Click', color: STAGE_COLOR.clicks },
  { key: 'basketShare', label: 'Basket-add', color: STAGE_COLOR.baskets },
  { key: 'purchShare', label: 'Purchase', color: STAGE_COLOR.purchases },
];
const LEAK_TO_KEY: Record<string, Key> = { imp_click: 'clickShare', click_basket: 'basketShare', basket_purch: 'purchShare' };
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);

export default function WeeklyTrend({ view, verdict }: { view: BrandView; verdict: Verdict }) {
  const cur = view.weekly;
  const prior = view.priorWeekly;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (cur.length < 2) return null;
  const nW = cur.length;
  const relKey: Key = verdict.primary === 'share' ? 'purchShare' : verdict.conv.stage ? LEAK_TO_KEY[verdict.conv.stage] : 'purchShare';

  const combined = [...prior.map((w) => ({ ...w, prior: true })), ...cur.map((w) => ({ ...w, prior: false }))];
  const N = combined.length;

  const W = 720, H = 240, padL = 34, padT = 16, padB = 26, padR = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const allVals = combined.flatMap((w) => SERIES.map((s) => w[s.key]));
  const dataMin = Math.min(...allVals), dataMax = Math.max(...allVals);
  const pad = Math.max(0.01, (dataMax - dataMin) * 0.25);
  const lo = Math.max(0, dataMin - pad), hi = dataMax + pad;
  const x = (i: number) => padL + (i / (N - 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo || 1)) * plotH;
  const dividerX = prior.length ? (x(prior.length - 1) + x(prior.length)) / 2 : padL;

  const rows = SERIES.map((s) => ({ ...s, val: cur[cur.length - 1][s.key], delta: cur[cur.length - 1][s.key] - mean(prior.map((w) => w[s.key])) }));

  // largest single-week drop of the verdict-relevant series (within current window)
  let dropIdx = -1, dropVal = 0;
  for (let i = 1; i < cur.length; i++) { const d = cur[i][relKey] - cur[i - 1][relKey]; if (d < dropVal) { dropVal = d; dropIdx = i; } }
  const dropGlobalIdx = dropIdx >= 0 ? prior.length + dropIdx : -1;

  const takeaway = buildTakeaway(verdict, nW, rows);
  const showDots = N <= 12;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.max(0, Math.min(N - 1, Math.round((vx - padL) / (plotW / (N - 1))))));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Weekly share trend</h3>
        <p className="text-[12px] text-gray-700 leading-relaxed mt-0.5 max-w-4xl"><span className="font-semibold">So what:</span> <span className="text-gray-600">{takeaway.text}</span>{takeaway.link && <button onClick={takeaway.link.onClick} className="text-cx-600 hover:text-cx-700 font-semibold ml-1">{takeaway.link.label} →</button>}</p>
      </div>
      <div className="px-4 py-4 flex items-stretch gap-4 flex-wrap">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block flex-1 min-w-[280px] cursor-crosshair" style={{ maxWidth: '100%' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {[lo, (lo + hi) / 2, hi].map((g, i) => (
            <g key={i}><line x1={padL} y1={y(g)} x2={padL + plotW} y2={y(g)} stroke="#F1F5F9" strokeWidth={1} /><text x={padL - 5} y={y(g) + 3} textAnchor="end" fontSize="9" fill="#CBD5E1">{(g * 100).toFixed(0)}%</text></g>
          ))}
          {prior.length > 0 && <><line x1={dividerX} y1={padT} x2={dividerX} y2={padT + plotH} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 3" /><text x={dividerX - 4} y={padT + 8} textAnchor="end" fontSize="8" fill="#CBD5E1">prior</text></>}
          {hover != null && <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + plotH} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 3" />}

          {SERIES.map((s) => {
            const emph = relKey === s.key;
            const priorPts = combined.map((w, i) => ({ i, v: w[s.key], p: w.prior })).filter((p) => p.p);
            const curPts = combined.map((w, i) => ({ i, v: w[s.key], p: w.prior })).filter((p) => !p.p);
            const path = (pts: { i: number; v: number }[]) => pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
            const bridge = priorPts.length && curPts.length ? `M ${x(priorPts[priorPts.length - 1].i)} ${y(priorPts[priorPts.length - 1].v)} L ${x(curPts[0].i)} ${y(curPts[0].v)}` : '';
            return (
              <g key={s.key}>
                {priorPts.length > 0 && <path d={path(priorPts)} fill="none" stroke={s.color} strokeWidth={1.4} opacity={0.28} strokeDasharray="4 3" />}
                {bridge && <path d={bridge} fill="none" stroke={s.color} strokeWidth={1.4} opacity={0.28} strokeDasharray="4 3" />}
                <path d={path(curPts)} fill="none" stroke={s.color} strokeWidth={emph ? 2.6 : 1.6} strokeOpacity={emph ? 1 : 0.5} strokeLinecap="round" strokeLinejoin="round" />
                {showDots && curPts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={2.5} fill={s.color} fillOpacity={emph ? 1 : 0.5} />)}
              </g>
            );
          })}
          {dropGlobalIdx > 0 && (
            <g><circle cx={x(dropGlobalIdx)} cy={y(cur[dropIdx][relKey])} r={5} fill="none" stroke="#DC2626" strokeWidth={1.5} /><text x={x(dropGlobalIdx)} y={y(cur[dropIdx][relKey]) - 9} textAnchor="middle" fontSize="8" fontWeight="700" fill="#DC2626">▼ {(dropVal * 100).toFixed(1)}pp</text></g>
          )}
          {hover != null && SERIES.map((s) => <circle key={s.key} cx={x(hover)} cy={y(combined[hover][s.key])} r={3.2} fill={s.color} stroke="white" strokeWidth={1.5} />)}
          {hover != null && <HoverTip x={x(hover)} onLeft={x(hover) > W * 0.6} week={combined[hover].week} prior={combined[hover].prior} vals={SERIES.map((s) => ({ label: s.label, color: s.color, v: combined[hover][s.key] }))} padT={padT} />}
          {combined.map((w, i) => <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle'} fontSize="8" fill={w.prior ? '#CBD5E1' : '#64748B'}>{weekLabel(w.week)}</text>)}
        </svg>

        <div className="flex flex-col justify-center gap-1.5 w-[190px] flex-shrink-0">
          {rows.map((r) => {
            const emph = relKey === r.key;
            return (
              <div key={r.key} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${emph ? 'bg-gray-50 ring-1 ring-gray-200' : ''}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2"><span className={`text-[11px] ${emph ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{r.label}</span><span className="text-[12px] font-bold tabular-nums text-gray-900">{(r.val * 100).toFixed(1)}%</span></div>
                  <div className={`text-[10px] font-medium tabular-nums ${r.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.delta >= 0 ? '▲' : '▼'} {Math.abs(r.delta * 100).toFixed(1)}pp vs prior {nW}w</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildTakeaway(v: Verdict, nW: number, rows: { label: string; delta: number }[]): { text: string; link?: { label: string; onClick: () => void } } {
  const p = v.share.pattern;
  if (p === 'parallel_decline') {
    const ds = [v.share.deltas.impressions, v.share.deltas.clicks, v.share.deltas.baskets, v.share.deltas.purchases].map((d) => d * 100);
    const rng = `${Math.max(...ds).toFixed(1)} to ${Math.min(...ds).toFixed(1)}pp`;
    return { text: `All four shares fell together (${rng}) — impression-share loss is carrying through the funnel. This is a visibility problem (rank, price, or a competitor gaining), not a conversion problem.` };
  }
  if (p === 'divergent_decline') {
    const worst = [...rows].sort((a, b) => a.delta - b.delta)[0];
    return { text: `${worst.label} share is down ${Math.abs(worst.delta * 100).toFixed(1)}pp vs the prior ${nW} weeks — a decline concentrated down-funnel.` };
  }
  if (p === 'improving') return { text: `Purchase share is up ${(v.share.purchDeltaPp * 100).toFixed(1)}pp vs the prior ${nW} weeks — the funnel is recovering.` };
  return { text: `Funnel shares are broadly stable vs the prior ${nW} weeks.` };
}

function HoverTip({ x, onLeft, week, prior, vals, padT }: { x: number; onLeft: boolean; week: string; prior: boolean; vals: { label: string; color: string; v: number }[]; padT: number }) {
  const boxW = 138, rowH = 14, boxH = 22 + vals.length * rowH;
  const bx = onLeft ? x - boxW - 10 : x + 10, by = padT;
  return (
    <g pointerEvents="none">
      <rect x={bx} y={by} width={boxW} height={boxH} rx={5} fill="#0F172A" opacity={0.94} />
      <text x={bx + 9} y={by + 14} fill="white" fontSize="10" fontWeight="700">w/e {weekLabel(week)}{prior ? ' (prior)' : ''}</text>
      {vals.map((r, i) => (<g key={r.label}><circle cx={bx + 12} cy={by + 24 + i * rowH} r={3} fill={r.color} /><text x={bx + 20} y={by + 27 + i * rowH} fill="#E5E7EB" fontSize="9">{r.label}</text><text x={bx + boxW - 9} y={by + 27 + i * rowH} textAnchor="end" fill="white" fontSize="9" fontWeight="700">{(r.v * 100).toFixed(1)}%</text></g>))}
    </g>
  );
}
