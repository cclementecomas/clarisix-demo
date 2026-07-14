import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gift, X, ArrowRight } from 'lucide-react';
import { CHANGELOG, CURRENT_VERSION, CHANGE_META, unseenCount, isNewer } from '../data/changelogData';

const SEEN_KEY = 'cx_whatsnew_lastSeen';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };

/** Tracks which release the user last opened (localStorage), so a badge can flag unseen ones. */
export function useWhatsNewSeen() {
  const [lastSeen, setLastSeen] = useState<string | null>(() => {
    try { return localStorage.getItem(SEEN_KEY); } catch { return null; }
  });
  const [prevSeen, setPrevSeen] = useState<string | null>(lastSeen);
  const markSeen = () => {
    setPrevSeen(lastSeen);                 // snapshot so the drawer can flag what was new
    try { localStorage.setItem(SEEN_KEY, CURRENT_VERSION); } catch { /* ignore */ }
    setLastSeen(CURRENT_VERSION);          // clears the badge
  };
  return { unseen: unseenCount(lastSeen), prevSeen, markSeen };
}

/** Right-hand slide-over listing the release notes — same drawer pattern as the ASIN/Keyword drawers. */
export function WhatsNewDrawer({ open, prevSeen, onClose, onNavigate }: {
  open: boolean;
  prevSeen: string | null;
  onClose: () => void;
  onNavigate?: (section: string, sub: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[80] bg-black/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed top-0 right-0 z-[90] h-screen w-full max-w-[460px] bg-white shadow-2xl transition-transform duration-200 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 bg-cx-600 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <h2 className="text-base font-bold">What's new</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-white/70">v{CURRENT_VERSION}</span>
            <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-white/15 flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {CHANGELOG.map((rel) => {
            const isNew = isNewer(rel.version, prevSeen ?? '');
            return (
              <div key={rel.version} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-gray-900">Version {rel.version}</span>
                  {isNew && <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded px-1.5 py-0.5">New</span>}
                  <span className="ml-auto text-[10px] text-gray-400">{fmtDate(rel.date)}</span>
                </div>
                <p className="text-[12px] text-gray-500 mb-3">{rel.headline}</p>

                <ul className="space-y-3">
                  {rel.changes.map((c, i) => {
                    const meta = CHANGE_META[c.type];
                    return (
                      <li key={i} className="flex gap-2.5">
                        <span className={`mt-0.5 flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.cls}`}>{meta.label}</span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-gray-900 leading-snug">{c.title}</div>
                          <div className="text-[12px] text-gray-500 leading-snug mt-0.5">{c.description}</div>
                          {c.route && onNavigate && (
                            <button
                              onClick={() => { onNavigate(c.route!.section, c.route!.sub); onClose(); }}
                              className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-cx-600 hover:text-cx-700"
                            >
                              Take me there <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/60 text-center flex-shrink-0">
          <span className="text-[10px] text-gray-400">You're up to date · v{CURRENT_VERSION}</span>
        </div>
      </aside>
    </>,
    document.body,
  );
}
