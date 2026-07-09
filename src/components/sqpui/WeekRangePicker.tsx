import { CalendarRange } from 'lucide-react';
import { weekLabel } from '../searchfunnel/format';

const SPANS = [2, 4, 8];

export default function WeekRangePicker({ weeks, endWeek, nWeeks, onChange }: {
  weeks: string[]; endWeek: string; nWeeks: number; onChange: (endWeek: string, nWeeks: number) => void;
}) {
  const endIdx = Math.max(0, weeks.indexOf(endWeek));
  const start = weeks[Math.max(0, endIdx - nWeeks + 1)];
  const available = Math.min(nWeeks, endIdx + 1);

  return (
    <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2.5 py-1 text-[11px]">
      <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-gray-500">Week ending</span>
      <select value={endWeek} onChange={(e) => onChange(e.target.value, nWeeks)} className="font-semibold text-gray-800 bg-transparent outline-none cursor-pointer">
        {[...weeks].reverse().map((w) => <option key={w} value={w}>{weekLabel(w)}</option>)}
      </select>
      <span className="text-gray-200">·</span>
      <div className="flex items-center bg-gray-100 rounded p-0.5">
        {SPANS.map((s) => (
          <button key={s} onClick={() => onChange(endWeek, s)} className={`px-1.5 py-0.5 rounded font-semibold transition-all ${nWeeks === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{s}w</button>
        ))}
      </div>
      <span className="text-gray-500">· {available} weeks ({weekLabel(start)} → {weekLabel(endWeek)}) vs prior {available}</span>
    </div>
  );
}
