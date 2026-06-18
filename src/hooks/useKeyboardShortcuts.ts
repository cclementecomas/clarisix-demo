import { useEffect, useRef } from 'react';
import { openFilter } from '../utils/filterBus';

export type NavTarget =
  | 'home' | 'Sales' | 'Advertising' | 'Inventory'
  | 'Profitability' | 'Content' | 'Customer Experience';

interface Options {
  onHelp: () => void;
  onToggleSidebar: () => void;
  onNavigate: (target: NavTarget) => void;
  enabled?: boolean;
}

// "g then <key>" → navigate
const G_MAP: Record<string, NavTarget> = {
  h: 'home', s: 'Sales', a: 'Advertising', i: 'Inventory',
  p: 'Profitability', c: 'Content', x: 'Customer Experience',
};

// "f then <key>" → open a filter dropdown (label dispatched on the filter bus)
const F_MAP: Record<string, string> = {
  o: 'Account', m: 'Marketplace', b: 'Brand', c: 'Category',
  s: 'Subcategory', t: 'Tag', a: 'ASIN', k: 'SKU', d: 'Date',
};

const isTypingTarget = (el: EventTarget | null): boolean => {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;
};

export function useKeyboardShortcuts({ onHelp, onToggleSidebar, onNavigate, enabled = true }: Options) {
  const pending = useRef<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const clearPending = () => {
      pending.current = null;
      if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    };

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;   // leave ⌘K and friends alone
      if (isTypingTarget(e.target)) return;

      // Resolve the second key of a pending two-key sequence
      if (pending.current) {
        const seq = pending.current;
        const key = e.key.toLowerCase();
        clearPending();
        if (seq === 'g' && G_MAP[key]) { e.preventDefault(); onNavigate(G_MAP[key]); }
        else if (seq === 'f' && F_MAP[key]) { e.preventDefault(); openFilter(F_MAP[key]); }
        return;
      }

      // Single-key shortcuts
      if (e.key === '?') { e.preventDefault(); onHelp(); return; }
      if (e.key === '[') { e.preventDefault(); onToggleSidebar(); return; }

      // Start a two-key sequence
      if (e.key === 'g' || e.key === 'f') {
        pending.current = e.key;
        timer.current = window.setTimeout(clearPending, 1200);
      }
    };

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearPending(); };
  }, [enabled, onHelp, onToggleSidebar, onNavigate]);
}
