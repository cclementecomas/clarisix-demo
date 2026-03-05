import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, House, Settings, Cable, LayoutDashboard, Clock } from 'lucide-react';
import { menuItems } from '../data/dashboardData';

interface CommandPaletteProps {
  onPageNavigate: (page: string) => void;
  onSectionNavigate: (section: string, sub: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  isSoon?: boolean;
  action: () => void;
}

export default function CommandPalette({ onPageNavigate, onSectionNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: 'home',
        label: 'Home',
        icon: <House className="w-4 h-4 text-gray-400" />,
        action: () => { onPageNavigate('home'); setOpen(false); },
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="w-4 h-4 text-gray-400" />,
        action: () => { onPageNavigate('settings'); setOpen(false); },
      },
      {
        id: 'connectors',
        label: 'Connectors',
        icon: <Cable className="w-4 h-4 text-gray-400" />,
        action: () => { onPageNavigate('connectors'); setOpen(false); },
      },
    ];

    for (const section of menuItems) {
      for (const sub of section.subItems) {
        const isSoon = section.comingSoonSubs?.includes(sub);
        items.push({
          id: `${section.label}/${sub}`,
          label: sub,
          sublabel: section.label,
          icon: <LayoutDashboard className="w-4 h-4 text-gray-400" />,
          isSoon,
          action: () => {
            if (!isSoon) {
              onSectionNavigate(section.label, sub);
            }
            setOpen(false);
          },
        });
      }
    }

    return items;
  }, [onPageNavigate, onSectionNavigate]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      filtered[activeIndex]?.action();
    }
  };

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-gray-100 text-gray-400 border border-gray-200">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</p>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-cx-50' : 'hover:bg-gray-50'
                } ${item.isSoon ? 'opacity-50' : ''}`}
              >
                {item.icon}
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{item.label}</span>
                  {item.sublabel && (
                    <span className="ml-2 text-xs text-gray-400">{item.sublabel}</span>
                  )}
                </span>
                {item.isSoon && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                    <Clock className="w-3 h-3" />
                    Soon
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="font-mono font-semibold">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono font-semibold">↵</kbd> open</span>
          <span><kbd className="font-mono font-semibold">esc</kbd> close</span>
          <span className="ml-auto"><kbd className="font-mono font-semibold">⌘K</kbd> / <kbd className="font-mono font-semibold">Ctrl+K</kbd></span>
        </div>
      </div>
    </div>
  );
}
