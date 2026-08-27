import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Check } from 'lucide-react';
import type { ColumnDef } from './DeepDiveTable';

interface HeatmapToggleProps {
  /** Only columns that declare a `heat` direction can be shaded. */
  columns: ColumnDef[];
  heatColumns: Set<string>;
  onToggle: (colId: string) => void;
  onToggleAll: (on: boolean) => void;
}

/** Heatmap picker: tick every column at once, or just the ones you're comparing. */
export default function HeatmapToggle({ columns, heatColumns, onToggle, onToggleAll }: HeatmapToggleProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleScroll(e: Event) {
      if (dropRef.current && dropRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      });
    }
    setOpen((v) => !v);
  }

  const allOn = columns.length > 0 && columns.every((c) => heatColumns.has(c.field));
  const anyOn = columns.some((c) => heatColumns.has(c.field));

  const Tick = ({ on }: { on: boolean }) => (
    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${on ? 'bg-cx-500 text-white' : 'border border-gray-300 bg-white'}`}>
      {on && <Check className="w-3 h-3" />}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
          open || anyOn
            ? 'border-cx-300 bg-cx-50 text-cx-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
        }`}
      >
        <Flame className="w-3.5 h-3.5" />
        Heatmap
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[240px] max-h-[400px] overflow-y-auto"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Colour cells
          </div>
          <button
            onClick={() => onToggleAll(!allOn)}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <Tick on={allOn} />
            <span>All columns</span>
          </button>
          <div className="px-3 pb-1 pt-0.5 text-[10px] text-gray-400 leading-snug">
            Green = good, red = bad, per column. Scale runs across the visible rows.
          </div>
          {(() => {
            const groupOrder: string[] = [];
            const buckets: Record<string, ColumnDef[]> = {};
            for (const col of columns) {
              const g = col.group ?? '';
              if (!buckets[g]) { buckets[g] = []; groupOrder.push(g); }
              buckets[g].push(col);
            }
            return groupOrder.map((g, gi) => (
              <div key={g || `__ungrouped_${gi}`}>
                {g && (
                  <div className="px-3 pt-2 pb-1 mt-1 border-t border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {g}
                  </div>
                )}
                {buckets[g].map((col) => {
                  const on = heatColumns.has(col.field);
                  return (
                    <button
                      key={col.field}
                      onClick={() => onToggle(col.field)}
                      className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm transition-colors ${on ? 'text-gray-800 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      <Tick on={on} />
                      <span className="truncate flex-1">{col.headerName || col.field}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{col.heat === 'down' ? 'low = good' : 'high = good'}</span>
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}
