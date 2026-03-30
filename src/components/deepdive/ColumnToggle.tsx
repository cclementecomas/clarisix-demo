import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Columns3, Check } from 'lucide-react';
import type { ColumnDef } from './DeepDiveTable';

interface ColumnToggleProps {
  columns: ColumnDef[];
  visibleColumns: Set<string>;
  onToggle: (colId: string) => void;
}

export default function ColumnToggle({ columns, visibleColumns, onToggle }: ColumnToggleProps) {
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

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
          open
            ? 'border-cx-300 bg-cx-50 text-cx-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
        }`}
      >
        <Columns3 className="w-3.5 h-3.5" />
        Columns
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[220px] max-h-[400px] overflow-y-auto"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Toggle Columns
          </div>
          {columns.map((col) => {
            const visible = visibleColumns.has(col.field);
            return (
              <button
                key={col.field}
                onClick={() => onToggle(col.field)}
                className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm transition-colors ${
                  visible
                    ? 'text-gray-800 hover:bg-gray-50'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    visible
                      ? 'bg-cx-500 text-white'
                      : 'border border-gray-300 bg-white'
                  }`}
                >
                  {visible && <Check className="w-3 h-3" />}
                </div>
                <span className="truncate">{col.headerName || col.field}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
