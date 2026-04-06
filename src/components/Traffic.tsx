import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  trafficKPIs, trafficFunnel,
  trafficTrendByGranularity, trafficSourcesByGranularity,
  productTrafficData, computeTrafficStatus, computeTrafficAlerts,
  type ProductTrafficRow, type TrendGranularity,
} from '../data/trafficData';
import LastRefreshed from './LastRefreshed';
import InfoTooltip from './InfoTooltip';
import {
  AlertTriangle, TrendingUp, TrendingDown, Info,
  ArrowUp, ArrowDown, ChevronsUpDown,
} from 'lucide-react';

// ─── Delta indicator ──────────────────────────────────────────────────────────

function Delta({
  value, suffix = '%', colorMode = 'pop',
}: {
  value: number;
  suffix?: string;
  colorMode?: 'pop' | 'ly' | 'invert';
}) {
  if (value === 0) return <span className="text-gray-300 text-[10px]">—</span>;
  const isPos = value > 0;
  let color: string;
  if (colorMode === 'ly') color = 'text-blue-500';
  else if (colorMode === 'invert') color = isPos ? 'text-red-600' : 'text-green-600';
  else color = isPos ? 'text-green-600' : 'text-red-600';

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${color}`}>
      {colorMode !== 'ly' && (isPos
        ? <ChevronUp className="w-2.5 h-2.5" />
        : <ChevronDown className="w-2.5 h-2.5" />)}
      {isPos ? '+' : ''}{Math.abs(value).toFixed(colorMode === 'ly' ? 1 : 1)}{suffix}
      {colorMode === 'ly'  && <span className="text-blue-400 text-[9px] ml-0.5">LY</span>}
      {colorMode === 'pop' && <span className="text-gray-400 text-[9px] ml-0.5">PoP</span>}
    </span>
  );
}

// ─── Granularity selector ─────────────────────────────────────────────────────

const GRAN_OPTS: { value: TrendGranularity; label: string }[] = [
  { value: 'day',     label: 'Day'     },
  { value: 'week',    label: 'Week'    },
  { value: 'month',   label: 'Month'   },
  { value: 'quarter', label: 'Quarter' },
];

function GranularitySelector({
  value, onChange,
}: { value: TrendGranularity; onChange: (g: TrendGranularity) => void }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
      {GRAN_OPTS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            value === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── KPI tiles — home page style ─────────────────────────────────────────────

const TRAFFIC_KPI_TOOLTIPS: Record<string, string> = {
  'Total Sessions': 'Unique visitor sessions across all traffic sources (organic + paid) for the selected period.',
  'Page Views': 'Total detail page views (glance views) across all active ASINs.',
  'Conv. Rate': 'Unit session percentage — units ordered ÷ total sessions. Decline signals listing or pricing issues.',
  'Organic Share': '% of total sessions from non-paid sources. Higher organic share reduces ad dependency.',
  'Ad Impressions': 'Total impressions across SP, SB, SD, and DSP ad campaigns.',
  'Avg CTR': 'Click-through rate — ad clicks ÷ ad impressions. Reflects ad creative and targeting effectiveness.',
};

function KPIRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {trafficKPIs.map((kpi, idx) => {
        const isPos = kpi.positive;
        const bgColor     = isPos ? 'bg-green-50'           : 'bg-red-50';
        const borderColor = isPos ? 'border-green-200/60 hover:border-green-300' : 'border-red-200/60 hover:border-red-300';
        const labelColor  = isPos ? 'text-green-700/70'     : 'text-red-700/70';
        const valueColor  = isPos ? 'text-green-900'        : 'text-red-900';
        const strokeColor = isPos ? '#166534'               : '#991B1B';
        const fillColor   = strokeColor;
        const gradId      = `trafficSparkFill-${idx}`;

        const sparkData = kpi.sparkline.map((v, i) => ({ v, i }));
        const minV = Math.min(...kpi.sparkline);
        const maxV = Math.max(...kpi.sparkline);
        const pad  = (maxV - minV) * 0.15;

        return (
          <div
            key={kpi.id}
            className={`${bgColor} rounded-xl border ${borderColor} p-3 pb-1.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>
                {kpi.label}
              </p>
              <InfoTooltip content={TRAFFIC_KPI_TOOLTIPS[kpi.label]} />
            </div>

            <div className="flex items-center justify-center my-1">
              <span className={`text-2xl font-extrabold tracking-tight ${valueColor}`}>
                {kpi.value}
              </span>
            </div>

            <div className="flex-1 min-h-[40px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={fillColor} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={[minV - pad, maxV + pad]} hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                          <span className="font-semibold">{d.v.toLocaleString()}</span>
                        </div>
                      );
                    }}
                    cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone" dataKey="v"
                    stroke={strokeColor} strokeWidth={2}
                    fill={`url(#${gradId})`}
                    dot={false}
                    activeDot={{ r: 3, fill: strokeColor, stroke: '#fff', strokeWidth: 1.5 }}
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between mt-1 pt-2 border-t border-black/5">
              <ChangeRow label="PoP" value={kpi.popChange} positive={isPos} />
              <ChangeRow label="LY"  value={kpi.lyChange}  positive={kpi.lyChange >= 0 ? isPos : !isPos} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChangeRow({ label, value, positive }: { label: string; value: number; positive: boolean }) {
  const color = positive ? 'text-green-800' : 'text-red-800';
  const Icon  = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-medium text-gray-500 uppercase">{label}</span>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-[11px] font-semibold ${color}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}%
      </span>
    </div>
  );
}

// ─── Traffic Funnel (trapezoid funnel) ───────────────────────────────────────

const FUNNEL_COLORS = ['#1D4ED8', '#7C3AED', '#0891B2', '#059669'];

function fmtFunnelVal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function TrafficFunnel() {
  const stages = trafficFunnel;

  // SVG layout constants
  const W        = 500;
  const STAGE_H  = 68;
  const GAP_H    = 22;   // space between trapezoids for conversion label
  const TOTAL_H  = stages.length * STAGE_H + (stages.length - 1) * GAP_H;
  const CX       = W / 2;

  // Visual widths per stage — use power scale so funnel looks proportional but readable
  const maxVal = stages[0].value;
  const WIDTHS = stages.map((s) => Math.max(120, Math.pow(s.value / maxVal, 0.22) * (W - 10)));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Conversion Funnel</h3>
            <InfoTooltip content="Impressions → clicks → cart adds → purchases from Search Query Performance data. Rates show step-to-step conversion." />
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Source: Search Query Performance</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 320 }}>
        <svg
          viewBox={`0 0 ${W} ${TOTAL_H}`}
          width="100%"
          style={{ maxHeight: 380, overflow: 'visible' }}
        >
          {stages.map((stage, i) => {
            const topW = WIDTHS[i];
            const botW = i < stages.length - 1 ? WIDTHS[i + 1] : WIDTHS[i] * 0.88;
            const y    = i * (STAGE_H + GAP_H);
            const midY = y + STAGE_H / 2;

            const x1 = CX - topW / 2;
            const x2 = CX + topW / 2;
            const x3 = CX + botW / 2;
            const x4 = CX - botW / 2;

            const popSign = stage.popChange >= 0 ? '+' : '';
            const popColor = stage.popChange >= 0 ? '#86EFAC' : '#FCA5A5';

            return (
              <g key={stage.label}>
                {/* Trapezoid body */}
                <polygon
                  points={`${x1},${y} ${x2},${y} ${x3},${y + STAGE_H} ${x4},${y + STAGE_H}`}
                  fill={FUNNEL_COLORS[i]}
                  opacity={0.92}
                />

                {/* Stage label */}
                <text
                  x={CX} y={midY - 14}
                  textAnchor="middle" fill="rgba(255,255,255,0.75)"
                  fontSize={10} fontWeight="600" letterSpacing="0.08em"
                >
                  {stage.label.toUpperCase()}
                </text>

                {/* Absolute value — large */}
                <text
                  x={CX} y={midY + 4}
                  textAnchor="middle" fill="white"
                  fontSize={20} fontWeight="700"
                >
                  {fmtFunnelVal(stage.value)}
                </text>

                {/* PoP change — below value */}
                <text
                  x={CX} y={midY + 20}
                  textAnchor="middle" fill={popColor}
                  fontSize={10} fontWeight="500"
                >
                  {popSign}{stage.popChange.toFixed(1)}% PoP
                </text>

                {/* Conversion rate label in the gap between stages */}
                {i < stages.length - 1 && (
                  <text
                    x={CX} y={y + STAGE_H + GAP_H / 2 + 4}
                    textAnchor="middle" fill="#94A3B8"
                    fontSize={10} fontWeight="500"
                  >
                    {stages[i + 1].convRate.toFixed(1)}% {stages[i + 1].convRateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Sessions & CVR Trend ─────────────────────────────────────────────────────

function SessionsTrend() {
  const [gran, setGran] = useState<TrendGranularity>('week');
  const data = trafficTrendByGranularity[gran];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Sessions & Conversion Rate</h3>
            <InfoTooltip content="Organic + paid sessions stacked with CVR % overlay. CVR = units ordered ÷ sessions." />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Organic + paid sessions with CVR overlay</p>
        </div>
        <GranularitySelector value={gran} onChange={setGran} />
      </div>
      <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradOrg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false} tickLine={false}
              interval={gran === 'day' ? 4 : 0}
            />
            <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#10B981' }} axisLine={false} tickLine={false} width={35} unit="%" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              formatter={(val: number, name: string) => [
                name === 'cvr' ? `${val}%` : val.toLocaleString(),
                name === 'organicSessions' ? 'Organic' : name === 'paidSessions' ? 'Paid' : 'CVR',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) => v === 'organicSessions' ? 'Organic' : v === 'paidSessions' ? 'Paid' : 'CVR %'}
            />
            <Area yAxisId="left"  type="monotone" dataKey="organicSessions" stackId="1" stroke="#3B82F6" fill="url(#gradOrg)"  strokeWidth={2} dot={false} isAnimationActive={false} />
            <Area yAxisId="left"  type="monotone" dataKey="paidSessions"    stackId="1" stroke="#8B5CF6" fill="url(#gradPaid)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Area yAxisId="right" type="monotone" dataKey="cvr"             stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Traffic Sources Breakdown ────────────────────────────────────────────────

const SOURCE_COLORS = {
  organic:           '#3B82F6',
  sponsoredProducts: '#8B5CF6',
  sponsoredBrands:   '#EC4899',
  sponsoredDisplay:  '#F59E0B',
  dsp:               '#6B7280',
};

const SOURCE_LABELS: Record<string, string> = {
  organic: 'Organic', sponsoredProducts: 'SP Ads',
  sponsoredBrands: 'SB Ads', sponsoredDisplay: 'SD Ads', dsp: 'DSP',
};

const SOURCE_KEYS = Object.keys(SOURCE_COLORS) as (keyof typeof SOURCE_COLORS)[];

function fmtSourceVal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function SourcesBreakdown() {
  const [gran, setGran] = useState<TrendGranularity>('week');
  const [showPct, setShowPct] = useState(false);
  const data = trafficSourcesByGranularity[gran];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Traffic Sources</h3>
            <InfoTooltip content="Sessions broken down by source: organic search, Sponsored Products, Sponsored Brands, Sponsored Display, and DSP." />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Sessions by source type</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPct(false)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${!showPct ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              Actuals
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={() => setShowPct(true)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${showPct ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              % of Total
            </button>
          </div>
          <GranularitySelector value={gran} onChange={setGran} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {SOURCE_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: SOURCE_COLORS[key] }} />
            <span className="text-[11px] text-gray-500 font-medium">{SOURCE_LABELS[key]}</span>
          </div>
        ))}
      </div>

      {/* Horizontal stacked bars */}
      <div className="space-y-1.5">
        {(() => {
          const totals = data.map((row) => SOURCE_KEYS.reduce((sum, k) => sum + row[k], 0));
          const maxTotal = Math.max(...totals);

          return data.map((row, i) => {
            const total = totals[i];
            const barWidthPct = showPct ? 100 : (maxTotal > 0 ? (total / maxTotal) * 100 : 0);

            return (
              <div key={row.label} className="relative flex items-center gap-2 group">
                <span className="text-[10px] font-medium text-gray-500 w-12 text-right flex-shrink-0 tabular-nums">
                  {row.label}
                </span>
                <div className="flex-1 h-6 bg-gray-50 rounded">
                  <div
                    className="flex h-full rounded overflow-hidden transition-all duration-300"
                    style={{ width: `${barWidthPct}%` }}
                  >
                    {SOURCE_KEYS.map((key) => {
                      const val = row[key];
                      const pct = total > 0 ? (val / total) * 100 : 0;
                      if (pct < 0.5) return null;
                      return (
                        <div
                          key={key}
                          className="relative h-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: SOURCE_COLORS[key] }}
                        >
                          {pct > 8 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/90 truncate px-1">
                              {showPct ? `${pct.toFixed(0)}%` : fmtSourceVal(val)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-600 w-10 text-right flex-shrink-0 tabular-nums">
                  {showPct ? '100%' : fmtSourceVal(total)}
                </span>
                {/* Hover tooltip with full breakdown */}
                <div className="absolute left-16 bottom-full mb-1 z-50 hidden group-hover:block pointer-events-none">
                  <div className="bg-gray-900 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl min-w-[180px]">
                    <p className="font-semibold mb-1.5 text-xs">{row.label} — {fmtSourceVal(total)} total</p>
                    {SOURCE_KEYS.map((key) => {
                      const val = row[key];
                      const pct = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <div key={key} className="flex items-center justify-between gap-3 py-0.5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: SOURCE_COLORS[key] }} />
                            {SOURCE_LABELS[key]}
                          </span>
                          <span className="font-semibold tabular-nums">{val.toLocaleString()} <span className="text-gray-400 font-normal">({pct.toFixed(1)}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 ml-6" />
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

// ─── Product Traffic Table ────────────────────────────────────────────────────

interface SelectedCell { rowIndex: number; colIndex: number; value: number; }

interface ColDef {
  key: keyof ProductTrafficRow;
  label: string;
  align: 'left' | 'right';
  format?: (v: number) => string;
  hint?: string;
  popKey?: keyof ProductTrafficRow;
  lyKey?: keyof ProductTrafficRow;
  cvrColored?: boolean;
  bbColored?: boolean;
  ctrColored?: boolean;
  nonNumeric?: boolean;
}

const COLUMNS: ColDef[] = [
  { key: 'asin',          label: 'ASIN',        align: 'left',  nonNumeric: true },
  { key: 'product',       label: 'Product',      align: 'left',  nonNumeric: true },
  { key: 'sessions',      label: 'Sessions',     align: 'right', format: (v) => v.toLocaleString(),   popKey: 'sessionsPoP', lyKey: 'sessionsLY' },
  { key: 'pageViews',     label: 'Page Views',   align: 'right', format: (v) => v.toLocaleString(),   popKey: 'pageViewsPoP' },
  { key: 'cvr',           label: 'CVR %',        align: 'right', format: (v) => `${v.toFixed(1)}%`,   popKey: 'cvrPoP',      lyKey: 'cvrLY', hint: 'Unit Session %', cvrColored: true },
  { key: 'buyBoxPct',     label: 'Buy Box',      align: 'right', format: (v) => `${v.toFixed(0)}%`,   popKey: 'buyBoxPctPoP',                                       bbColored:  true },
  { key: 'ctr',           label: 'CTR %',        align: 'right', format: (v) => `${v.toFixed(2)}%`,   popKey: 'ctrPoP',                    hint: 'Clicks ÷ impressions', ctrColored: true },
  { key: 'organicPct',    label: 'Organic %',    align: 'right', format: (v) => `${v.toFixed(0)}%`,   popKey: 'organicPctPoP' },
  { key: 'adImpressions', label: 'Impressions',  align: 'right', format: (v) => v.toLocaleString(),   popKey: 'adImpressionsPoP' },
];

const DEFAULT_VISIBLE = new Set<keyof ProductTrafficRow>(['asin', 'product', 'sessions', 'cvr', 'buyBoxPct', 'ctr', 'organicPct']);

function getRectCells(
  start: { row: number; col: number },
  end:   { row: number; col: number },
  rows:  any[],
  cols:  ColDef[],
): SelectedCell[] {
  const minR = Math.min(start.row, end.row), maxR = Math.max(start.row, end.row);
  const minC = Math.min(start.col, end.col), maxC = Math.max(start.col, end.col);
  const cells: SelectedCell[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const col = cols[c];
      if (!col || col.nonNumeric) continue;
      const v = parseFloat(String(rows[r]?.[col.key]));
      if (!isNaN(v)) cells.push({ rowIndex: r, colIndex: c, value: v });
    }
  }
  return cells;
}

function SelectionStats({ cells }: { cells: SelectedCell[] }) {
  if (cells.length === 0) return null;
  const vals   = cells.map((c) => c.value);
  const sum    = vals.reduce((a, b) => a + b, 0);
  const avg    = sum / vals.length;
  const sorted = [...vals].sort((a, b) => a - b);
  const median = vals.length % 2 === 1
    ? sorted[Math.floor(vals.length / 2)]
    : (sorted[vals.length / 2 - 1] + sorted[vals.length / 2]) / 2;
  const fmt = (n: number) =>
    Math.abs(n) >= 1000
      ? n.toLocaleString('en-US', { maximumFractionDigits: 2 })
      : n.toLocaleString('en-US', { maximumFractionDigits: 4 });

  const stats = [
    { label: 'Count',   value: vals.length.toString() },
    { label: 'Sum',     value: fmt(sum)    },
    { label: 'Average', value: fmt(avg)    },
    { label: 'Median',  value: fmt(median) },
    { label: 'Min',     value: fmt(Math.min(...vals)) },
    { label: 'Max',     value: fmt(Math.max(...vals)) },
  ];

  return (
    <div className="flex items-center gap-1 text-xs">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 mx-0.5">|</span>}
          <span className="text-gray-500 font-medium">{s.label}:</span>
          <span className="text-gray-800 font-semibold tabular-nums">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProductTable({ cvrThreshold }: { cvrThreshold: number }) {
  const [sortKey, setSortKey]           = useState<keyof ProductTrafficRow>('sessions');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [visible, setVisible]           = useState<Set<keyof ProductTrafficRow>>(DEFAULT_VISIBLE);
  const [showPoP, setShowPoP]           = useState(true);
  const [showLY, setShowLY]             = useState(false);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [showHint, setShowHint]         = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const dragStart  = useRef<{ row: number; col: number } | null>(null);
  const isDragging = useRef(false);
  const sortedRef  = useRef<any[]>([]);
  const colsRef    = useRef<ColDef[]>([]);

  useEffect(() => {
    const up = () => { isDragging.current = false; dragStart.current = null; };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  useEffect(() => {
    if (showHint) {
      const t = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showHint]);

  const withStatus = useMemo(() =>
    productTrafficData.map((row) => ({
      ...row,
      _status: computeTrafficStatus(row.cvr, row.sessionsPoP, cvrThreshold),
    })), [cvrThreshold]);

  const sorted = useMemo(() => {
    let rows = withStatus;
    if (statusFilter !== 'all') rows = rows.filter((r) => r._status === statusFilter);
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return 0;
    });
  }, [withStatus, sortKey, sortDir, statusFilter]);

  const visibleCols = useMemo(() => COLUMNS.filter((c) => visible.has(c.key)), [visible]);

  sortedRef.current = sorted;
  colsRef.current   = visibleCols;

  const handleMouseDown = useCallback((e: React.MouseEvent, ri: number, ci: number) => {
    if (e.button !== 0) return;
    e.preventDefault();

    if (!hasInteracted) {
      setHasInteracted(true);
      setShowHint(false);
    }

    isDragging.current = true;
    dragStart.current  = { row: ri, col: ci };

    const col = colsRef.current[ci];
    if (!col || col.nonNumeric) return;
    const v = parseFloat(String(sortedRef.current[ri]?.[col.key]));
    if (isNaN(v)) return;

    if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const exists = prev.find((c) => c.rowIndex === ri && c.colIndex === ci);
        return exists
          ? prev.filter((c) => !(c.rowIndex === ri && c.colIndex === ci))
          : [...prev, { rowIndex: ri, colIndex: ci, value: v }];
      });
    } else {
      setSelectedCells((prev) => {
        const single = prev.length === 1 && prev[0].rowIndex === ri && prev[0].colIndex === ci;
        return single ? [] : [{ rowIndex: ri, colIndex: ci, value: v }];
      });
    }
  }, [hasInteracted]);

  const handleMouseEnter = useCallback((ri: number, ci: number) => {
    if (!isDragging.current || !dragStart.current) return;
    const cells = getRectCells(dragStart.current, { row: ri, col: ci }, sortedRef.current, colsRef.current);
    setSelectedCells(cells);
  }, []);

  const cellKeys = useMemo(
    () => new Set(selectedCells.map((c) => `${c.rowIndex}-${c.colIndex}`)),
    [selectedCells],
  );

  const counts = useMemo(() => ({
    critical: withStatus.filter((r) => r._status === 'critical').length,
    warning:  withStatus.filter((r) => r._status === 'warning').length,
    healthy:  withStatus.filter((r) => r._status === 'healthy').length,
  }), [withStatus]);

  const selectedValues = useMemo(() => selectedCells.map((c) => c.value), [selectedCells]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
      {/* Hint toast */}
      {showHint && (
        <div className="absolute top-14 right-5 z-50 animate-fade-slide-in">
          <div className="bg-cx-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-gentle-pulse">
            <span className="font-medium">Click or drag cells to see statistics</span>
            <button onClick={() => setShowHint(false)} className="text-white/80 hover:text-white transition-colors ml-1">✕</button>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-cx-500" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">Product Traffic</h3>
          <InfoTooltip content="Per-ASIN traffic metrics with status flags. Critical/warning thresholds based on CVR and session trends." />
        </div>
        <div className="flex items-center gap-3">
          <SelectionStats cells={selectedCells} />

          {/* Status filter */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(['all', 'critical', 'warning', 'healthy'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md capitalize transition-all ${
                  statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 'all' ? `All (${withStatus.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`}
              </button>
            ))}
          </div>

          {/* PoP / LY toggle */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPoP((p) => !p)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${showPoP ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              PoP
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={() => setShowLY((p) => !p)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${showLY ? 'bg-cx-500 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              LY
            </button>
          </div>

          {/* Column toggle */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-500 hover:text-cx-500 hover:border-cx-300 transition-colors">
              Columns
            </button>
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[180px] hidden group-focus-within:block group-hover:block">
              {COLUMNS.filter((c) => !c.nonNumeric).map((c) => (
                <button
                  key={c.key}
                  onClick={() => setVisible((prev) => { const next = new Set(prev); if (next.has(c.key)) next.delete(c.key); else next.add(c.key); return next; })}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                >
                  <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${visible.has(c.key) ? 'bg-cx-500 border-cx-500' : 'border-gray-300'}`}>
                    {visible.has(c.key) && <span className="text-white text-[8px] font-bold">✓</span>}
                  </span>
                  <span className="text-gray-700">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 420 }}>
        <table className="w-full border-collapse text-[13px]" style={{ fontFamily: "'Inter', system-ui, sans-serif", tableLayout: 'auto' }}>
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  title={col.hint}
                  onClick={() => {
                    if (col.nonNumeric) return;
                    if (sortKey === col.key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
                    else { setSortKey(col.key); setSortDir('desc'); }
                  }}
                  className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none whitespace-nowrap hover:bg-slate-100 transition-colors ${!col.nonNumeric ? 'cursor-pointer' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {!col.nonNumeric && (
                      sortKey === col.key
                        ? sortDir === 'asc'
                          ? <ArrowUp className="w-3 h-3 text-cx-500 flex-shrink-0" />
                          : <ArrowDown className="w-3 h-3 text-cx-500 flex-shrink-0" />
                        : <ChevronsUpDown className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => {
              const rowBg = row._status === 'critical'
                ? 'bg-red-50/50'
                : row._status === 'warning'
                  ? 'bg-yellow-50/30'
                  : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';

              return (
                <tr key={row.asin} className={`${rowBg} border-b border-slate-50 hover:bg-cx-50/50 transition-colors`}>
                  {visibleCols.map((col, ci) => {
                    const val = row[col.key];
                    const isSelected = cellKeys.has(`${ri}-${ci}`);

                    if (col.nonNumeric) {
                      return (
                        <td
                          key={col.key}
                          className={`px-2.5 py-1.5 select-none overflow-hidden text-ellipsis whitespace-nowrap ${col.key === 'asin' ? 'font-mono text-xs text-gray-600' : 'font-semibold text-gray-800'} ${isSelected ? 'bg-cx-100 ring-[1.5px] ring-inset ring-cx-500' : ''}`}
                          title={col.key === 'product' ? String(val) : undefined}
                          onMouseDown={(e) => handleMouseDown(e, ri, ci)}
                          onMouseEnter={() => handleMouseEnter(ri, ci)}
                        >
                          {String(val ?? '')}
                        </td>
                      );
                    }

                    const numVal = val as number;
                    const fmtVal = col.format ? col.format(numVal) : numVal.toLocaleString();
                    const popVal = col.popKey ? (row[col.popKey] as number) : undefined;
                    const lyVal  = col.lyKey  ? (row[col.lyKey]  as number) : undefined;

                    let valColor = '';
                    if (col.cvrColored) {
                      const crit = cvrThreshold / 2;
                      valColor = numVal < crit ? 'text-red-700 font-semibold' : numVal < cvrThreshold ? 'text-yellow-700 font-semibold' : 'text-green-700 font-semibold';
                    } else if (col.bbColored) {
                      valColor = numVal < 70 ? 'text-red-700 font-semibold' : numVal < 85 ? 'text-yellow-700' : '';
                    } else if (col.ctrColored) {
                      valColor = numVal < 0.3 ? 'text-red-700 font-semibold' : numVal < 0.5 ? 'text-yellow-700' : '';
                    }

                    return (
                      <td
                        key={col.key}
                        className={`px-2.5 py-1.5 tabular-nums select-none cursor-cell overflow-hidden text-ellipsis whitespace-nowrap ${isSelected ? 'bg-cx-100 ring-[1.5px] ring-inset ring-cx-500' : ''}`}
                        onMouseDown={(e) => handleMouseDown(e, ri, ci)}
                        onMouseEnter={() => handleMouseEnter(ri, ci)}
                      >
                        {showPoP && popVal !== undefined ? (
                          <div className="space-y-px">
                            <div className={`font-semibold text-[13px] leading-none ${valColor}`}>{fmtVal}</div>
                            <div className="flex items-center gap-1 text-[10px] leading-none">
                              <span className="text-gray-400 font-medium w-5 shrink-0">PoP</span>
                              <span className={`font-semibold tabular-nums ${popVal > 0 ? 'text-green-700' : popVal < 0 ? 'text-red-700' : 'text-gray-400'}`}>
                                {popVal > 0 ? '+' : ''}{popVal.toFixed(1)}%
                              </span>
                            </div>
                            {showLY && lyVal !== undefined && (
                              <div className="flex items-center gap-1 text-[10px] leading-none">
                                <span className="text-gray-400 font-medium w-5 shrink-0">LY</span>
                                <span className="font-semibold tabular-nums text-blue-500">
                                  {lyVal > 0 ? '+' : ''}{lyVal.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        ) : showLY && lyVal !== undefined ? (
                          <div className="space-y-px">
                            <div className={`font-semibold text-[13px] leading-none ${valColor}`}>{fmtVal}</div>
                            <div className="flex items-center gap-1 text-[10px] leading-none">
                              <span className="text-gray-400 font-medium w-5 shrink-0">LY</span>
                              <span className="font-semibold tabular-nums text-blue-500">
                                {lyVal > 0 ? '+' : ''}{lyVal.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className={`text-[13px] font-semibold ${valColor}`}>{fmtVal}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-gray-100 flex items-center gap-4 flex-wrap text-xs text-gray-500">
        <span>{sorted.length} products</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          CVR &lt;{(cvrThreshold / 2).toFixed(0)}% or sessions −20% PoP = Critical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          CVR {(cvrThreshold / 2).toFixed(0)}–{cvrThreshold}% or sessions −5% PoP = Warning
        </span>
      </div>
    </div>
  );
}

// ─── Traffic Alerts ───────────────────────────────────────────────────────────

const ALERT_STYLES = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'text-red-500',    text: 'text-red-800'    },
  warning:  { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-500', text: 'text-yellow-800' },
  info:     { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-500',   text: 'text-blue-800'   },
};

function AlertIcon({ type }: { type: 'critical' | 'warning' | 'info' }) {
  if (type === 'critical') return <AlertTriangle className="w-4 h-4" />;
  if (type === 'warning')  return <TrendingDown className="w-4 h-4" />;
  return <Info className="w-4 h-4" />;
}

function TrafficAlertsPanel({
  cvrThreshold, onCvrThresholdChange,
}: {
  cvrThreshold: number;
  onCvrThresholdChange: (v: number) => void;
}) {
  const alerts = useMemo(
    () => computeTrafficAlerts(productTrafficData, cvrThreshold),
    [cvrThreshold],
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">Traffic Alerts</h3>
          <InfoTooltip content="Auto-generated alerts when CVR or session trends breach the configured threshold." />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          CVR warning threshold
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1} max={50} step={0.5}
              value={cvrThreshold}
              onChange={(e) => onCvrThresholdChange(Math.max(1, Math.min(50, Number(e.target.value) || 10)))}
              className="w-16 px-2 py-1 text-xs font-semibold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cx-500/20 focus:border-cx-400 text-center"
            />
            <span className="text-gray-400 font-medium">%</span>
          </div>
          <span className="text-gray-400">(critical &lt;{(cvrThreshold / 2).toFixed(1)}%)</span>
        </label>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No alerts at this threshold.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const s = ALERT_STYLES[alert.type];
            return (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}>
                <span className={`mt-0.5 flex-shrink-0 ${s.icon}`}><AlertIcon type={alert.type} /></span>
                <div>
                  <p className={`text-xs font-semibold ${s.text}`}>{alert.title}</p>
                  <p className={`text-xs mt-0.5 ${s.text} opacity-80`}>{alert.message}</p>
                  {alert.asin && <p className="text-[10px] mt-1 font-mono text-gray-500">{alert.asin}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Traffic() {
  const [cvrThreshold, setCvrThreshold] = useState(10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Traffic</h2>
          <p className="text-sm text-gray-500 mt-0.5">Sessions, page views, ad clicks, and conversion rates by product</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Amazon Business Reports</span>
          </div>
          <LastRefreshed offsetMinutes={9} />
        </div>
      </div>

      {/* KPI tiles — home page card style */}
      <KPIRow />

      {/* Funnel + Sessions trend — equal-height columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        <TrafficFunnel />
        <SessionsTrend />
      </div>

      {/* Sources breakdown */}
      <SourcesBreakdown />

      {/* Product table */}
      <ProductTable cvrThreshold={cvrThreshold} />

      {/* Alerts */}
      <TrafficAlertsPanel cvrThreshold={cvrThreshold} onCvrThresholdChange={setCvrThreshold} />
    </div>
  );
}
