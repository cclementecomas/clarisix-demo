import { useId } from 'react';
import { LayoutDashboard, Table2, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, X, Filter } from 'lucide-react';
import { useCx, type CxMode } from '../../contexts/CxContext';
import InfoTooltip from '../InfoTooltip';
import { STATUS_META, DATA_THROUGH_LABEL, type ProductStatus, type Priority } from '../../data/cxData';

// Clarisix chart palette (from index.css cx-d* data-viz tokens). No competitor purple.
export const CX = {
  primary: '#0E5A8A',   // deep blue — primary accent (cx-500 / cx-d1)
  blue2: '#4B9DCC',     // light blue (cx-d2)
  teal: '#0F766E',      // teal (cx-d3)
  green: '#166534',     // green (cx-d4)
  amber: '#C68900',     // gold/amber (cx-d5)
  brand: '#D55E00',     // Clarisix orange (cx-d6)
  rose: '#BE123C',      // rose-700 — negative/unprofitable signal
  neutral: '#CBD5E1',   // slate-300 for de-emphasised series
  benchmark: '#94A3B8', // slate-400 for reference lines
};

// ── formatters (USD demo) ────────────────────────────────────────────────────
export const money = (v: number | null, compact = true): string => {
  if (v == null) return '—';
  const neg = v < 0; const a = Math.abs(v);
  const s = compact
    ? a >= 1e6 ? `$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M` : a >= 1e3 ? `$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K` : `$${a.toFixed(2)}`
    : `$${a.toLocaleString('en-US')}`;
  return neg ? `-${s}` : s;
};
export const pct = (v: number | null, d = 1): string => (v == null ? '—' : `${v.toFixed(d)}%`);
export const num = (v: number | null, d = 2): string => (v == null ? '—' : v.toFixed(d));
export const int = (v: number | null): string => (v == null ? '—' : Math.round(v).toLocaleString('en-US'));
export const signedPct = (v: number, d = 1): string => `${v > 0 ? '+' : ''}${v.toFixed(d)}%`;
export const signedPp = (v: number, d = 1): string => `${v > 0 ? '+' : ''}${v.toFixed(d)}pp`;

// ── delta text (semantic colour; higherIsBetter flips for cost-like metrics) ──
export function Delta({ value, unit = '%', higherIsBetter = true, className = '' }: { value: number; unit?: 'pp' | '%'; higherIsBetter?: boolean; className?: string }) {
  const good = higherIsBetter ? value >= 0 : value <= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  const txt = unit === 'pp' ? signedPp(value) : signedPct(value);
  return (
    <span className={`inline-flex items-center gap-0.5 tabular-nums font-semibold ${good ? 'text-emerald-600' : 'text-rose-600'} ${className}`}>
      <Icon className="w-3.5 h-3.5" />{txt}
    </span>
  );
}

export function Thumb({ hue, size = 32 }: { hue: number; size?: number }) {
  return (
    <span className="inline-block rounded-md flex-shrink-0 ring-1 ring-black/5"
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 62% 62%), hsl(${(hue + 28) % 360} 58% 48%))` }} />
  );
}

const TONE: Record<string, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  bad: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-gray-100 text-gray-500 ring-gray-200',
};
export function StatusChip({ status }: { status: ProductStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 ${TONE[m.tone]}`}>{m.label}</span>;
}

const PRIO: Record<Priority, { label: string; cls: string; dot: string }> = {
  high: { label: 'High', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  monitor: { label: 'Monitor', cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
};
export function PriorityChip({ priority }: { priority: Priority }) {
  const p = PRIO[priority];
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ${p.cls}`}><span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{p.label}</span>;
}

// ── sparkline (line, or filled area to match the platform KPI cards) ─────────
export function Sparkline({ values, w = 96, h = 28, color = CX.primary, area = false, fullWidth = false }: { values: number[]; w?: number; h?: number; color?: string; area?: boolean; fullWidth?: boolean }) {
  const gid = useId();
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / range) * (h - 4) - 2;
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const areaD = `M0,${h} ` + values.map((v, i) => `L${x(i)},${y(v)}`).join(' ') + ` L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={fullWidth ? '100%' : w} height={h} preserveAspectRatio={fullWidth ? 'none' : 'xMidYMid meet'} className="block overflow-visible">
      {area && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
      )}
      {area && <path d={areaD} fill={`url(#${gid})`} stroke="none" />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={fullWidth ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect={fullWidth ? 'non-scaling-stroke' : undefined} />
      {!fullWidth && <circle cx={w} cy={y(values[values.length - 1])} r={2.4} fill={color} />}
    </svg>
  );
}

// ── primary metric card (decision mode) ──────────────────────────────────────
// Matches the platform KPI card (KPICards.tsx): sentiment-tinted, centred value,
// filled-area sparkline, trend-icon footer — while keeping the CX share + context.
export function MetricCard({ label, value, shareLabel, delta, deltaUnit = '%', higherIsBetter = true, context, spark, definition }: {
  label: string; value: string; shareLabel?: string; delta: number; deltaUnit?: 'pp' | '%'; higherIsBetter?: boolean; context?: string; spark?: number[]; definition?: string;
}) {
  const good = higherIsBetter ? delta >= 0 : delta <= 0;
  const p = good
    ? { bg: 'bg-green-50', border: 'border-green-200/60 hover:border-green-300', label: 'text-green-700/70', value: 'text-green-900', spark: '#166534', chg: 'text-green-800' }
    : { bg: 'bg-red-50', border: 'border-red-200/60 hover:border-red-300', label: 'text-red-700/70', value: 'text-red-900', spark: '#991B1B', chg: 'text-red-800' };
  const Icon = delta >= 0 ? TrendingUp : TrendingDown;
  const chgTxt = deltaUnit === 'pp' ? signedPp(delta) : signedPct(delta);
  return (
    <div className={`${p.bg} rounded-xl border ${p.border} p-3 pb-1.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${p.label}`} title={definition}>{label}</p>
        {definition && <InfoTooltip content={definition} />}
      </div>

      <div className="flex flex-col items-center my-1">
        <span className={`text-2xl font-extrabold tracking-tight ${p.value}`}>{value}</span>
        {shareLabel && <span className="text-[11px] font-medium text-gray-500 mt-0.5">{shareLabel}</span>}
      </div>

      {spark && (
        <div className="flex-1 min-h-[40px] -mx-1">
          <Sparkline values={spark} color={p.spark} h={40} area fullWidth />
        </div>
      )}

      <div className="flex items-center gap-1 mt-1 pt-2 border-t border-black/5">
        <span className="text-[9px] font-medium text-gray-500 uppercase">PoP</span>
        <Icon className={`w-3 h-3 ${p.chg}`} />
        <span className={`text-[11px] font-semibold ${p.chg}`}>{chgTxt}</span>
        <span className="text-[9px] text-gray-400 ml-0.5">vs prev.</span>
      </div>

      {context && <p className="text-[11px] text-gray-500 leading-snug mt-1.5">{context}</p>}
    </div>
  );
}

// ── Decision | Analyst switch ────────────────────────────────────────────────
export function ModeSwitch() {
  const { mode, setMode } = useCx();
  const opt = (m: CxMode, label: string, Icon: typeof Table2) => (
    <button onClick={() => setMode(m)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5" role="tablist" aria-label="Presentation mode">
      {opt('decision', 'Decision', LayoutDashboard)}
      {opt('analyst', 'Analyst', Table2)}
    </div>
  );
}

// ── evidence banner (shown in Analyst when arriving from an insight) ──────────
export function EvidenceBanner({ matches }: { matches: number }) {
  const { evidence, clearEvidence, setMode } = useCx();
  if (!evidence) return null;
  return (
    <div className="flex items-center gap-3 bg-cx-50 border border-cx-200 rounded-lg px-3.5 py-2.5 text-[12px]">
      <Filter className="w-4 h-4 text-cx-600 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-cx-900 font-semibold">Showing: {evidence.filterLabel}.</span>
        <span className="text-cx-700 ml-1">{matches} matching {matches === 1 ? 'record' : 'records'} · rule <span className="font-mono text-[11px] bg-white/70 px-1 rounded">{evidence.rule}</span></span>
      </div>
      <button onClick={clearEvidence} className="flex-shrink-0 text-[11px] font-semibold text-cx-600 hover:text-cx-800 inline-flex items-center gap-1">Clear filter <X className="w-3 h-3" /></button>
      <button onClick={() => { clearEvidence(); setMode('decision'); }} className="flex-shrink-0 text-[11px] font-semibold text-gray-500 hover:text-gray-700 border-l border-cx-200 pl-3">Back to Decision</button>
    </div>
  );
}

// ── data-freshness pill ──────────────────────────────────────────────────────
export function Freshness({ label = DATA_THROUGH_LABEL }: { label?: string }) {
  return <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{label}</span>;
}

// ── CX page header (title + decision question + mode switch) ──────────────────
export function CxHeader({ title, question }: { title: string; question: string }) {
  const { mode } = useCx();
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">{question}</p>
      </div>
      <div className="flex items-center gap-3">
        {mode === 'decision' && <Freshness />}
        <ModeSwitch />
      </div>
    </div>
  );
}
