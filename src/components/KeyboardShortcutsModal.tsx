import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Shortcut { label: string; keys: string[]; seq?: boolean }
interface Group { title: string; items: Shortcut[] }

// Left and right columns mirror the reference layout.
const LEFT_COLUMN: Group[] = [
  {
    title: 'Help',
    items: [{ label: 'Show keyboard shortcuts', keys: ['?'] }],
  },
  {
    title: 'Filters',
    items: [
      { label: 'Open Account filter', keys: ['f', 'o'], seq: true },
      { label: 'Open Marketplace filter', keys: ['f', 'm'], seq: true },
      { label: 'Open Brand filter', keys: ['f', 'b'], seq: true },
      { label: 'Open Category filter', keys: ['f', 'c'], seq: true },
      { label: 'Open Subcategory filter', keys: ['f', 's'], seq: true },
      { label: 'Open Tag filter', keys: ['f', 't'], seq: true },
      { label: 'Open ASIN filter', keys: ['f', 'a'], seq: true },
      { label: 'Open SKU filter', keys: ['f', 'k'], seq: true },
      { label: 'Open date picker', keys: ['f', 'd'], seq: true },
    ],
  },
  {
    title: 'Layout',
    items: [{ label: 'Toggle sidebar', keys: ['['] }],
  },
];

const RIGHT_COLUMN: Group[] = [
  {
    title: 'Navigation',
    items: [
      { label: 'Go to Home', keys: ['g', 'h'], seq: true },
      { label: 'Go to Sales', keys: ['g', 's'], seq: true },
      { label: 'Go to Advertising', keys: ['g', 'a'], seq: true },
      { label: 'Go to Inventory', keys: ['g', 'i'], seq: true },
      { label: 'Go to Profitability', keys: ['g', 'p'], seq: true },
      { label: 'Go to Content', keys: ['g', 'c'], seq: true },
      { label: 'Go to Customer Experience', keys: ['g', 'x'], seq: true },
      { label: 'Open command palette', keys: ['⌘K'] },
    ],
  },
  {
    title: 'Date presets',
    items: [
      { label: 'Apply (in date picker)', keys: ['↵'] },
      { label: 'Close date picker', keys: ['esc'] },
      { label: 'Today (in date picker)', keys: ['t'] },
      { label: 'Yesterday', keys: ['y'] },
      { label: 'Week to date', keys: ['w'] },
      { label: 'Last week', keys: ['1'] },
      { label: 'Month to date', keys: ['m'] },
      { label: 'Last month', keys: ['2'] },
      { label: 'Year to date', keys: ['r'] },
      { label: 'Last year', keys: ['3'] },
      { label: 'All time', keys: ['a'] },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-md shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ item }: { item: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{item.label}</span>
      <span className="flex items-center gap-1.5 flex-shrink-0">
        {item.keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {item.seq && i > 0 && <span className="text-[11px] text-gray-400">then</span>}
            <Kbd>{k}</Kbd>
          </span>
        ))}
      </span>
    </div>
  );
}

function GroupBlock({ group }: { group: Group }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{group.title}</h3>
      <div>
        {group.items.map((item) => <ShortcutRow key={item.label} item={item} />)}
      </div>
    </div>
  );
}

export default function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-10" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Keyboard shortcuts</h2>
            <p className="mt-1.5 text-[13px] text-gray-500 leading-relaxed max-w-xl">
              Two-key sequences (e.g. <Kbd>g</Kbd> <span className="text-gray-400">then</span> <Kbd>h</Kbd>) work when no input is focused.
              Press <Kbd>?</Kbd> at any time to reopen this list.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <div>{LEFT_COLUMN.map((g) => <GroupBlock key={g.title} group={g} />)}</div>
          <div>{RIGHT_COLUMN.map((g) => <GroupBlock key={g.title} group={g} />)}</div>
        </div>
      </div>
    </div>
  );
}
