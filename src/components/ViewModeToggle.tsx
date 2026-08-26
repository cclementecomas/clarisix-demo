// Reusable Decision/Analyst presentation toggle (visual twin of the CX ModeSwitch,
// but decoupled from CxContext so any page can own its own local view state).
// Decision = summarised "what's wrong, what to do"; Analyst = full data for analysis/export.
import { LayoutDashboard, Table2 } from 'lucide-react';

export type ViewMode = 'decision' | 'analyst';

export default function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const opt = (m: ViewMode, label: string, Icon: typeof Table2) => (
    <button
      key={m}
      onClick={() => onChange(m)}
      role="tab"
      aria-selected={mode === m}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
    >
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
