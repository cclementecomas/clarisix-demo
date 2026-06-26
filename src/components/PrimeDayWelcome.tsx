// ─── Prime Day Recap — first-open welcome ────────────────────────────────────
// A one-time welcome overlay shown the first time the recap is opened. Built with
// Framer Motion (motion/react): the card springs in, its content staggers up, and
// the headline revenue animates (counts up). Fires once (tracked in localStorage);
// the "Replay" pill re-triggers it on demand.

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { PartyPopper, TrendingUp, X } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import { primeDayRevenue, pctDelta } from '../data/primeDayData';

const SEEN_KEY = 'clarisix_prime_day_welcome_seen';

const card = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22, staggerChildren: 0.07, delayChildren: 0.12 },
  },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 24 } },
};

export default function PrimeDayWelcome() {
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);

  const revPct = pctDelta(primeDayRevenue.thisYear, primeDayRevenue.lastYear);
  const count = useMotionValue(0);
  const revText = useTransform(count, (v) => fc(Math.round(v), currency, { compact: true }));

  const fire = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Animate the revenue count-up whenever the overlay opens.
  useEffect(() => {
    if (!open) return;
    count.set(0);
    const controls = animate(count, primeDayRevenue.thisYear, { duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.25 });
    return () => controls.stop();
  }, [open, count]);

  // Auto-fire once, the first time the page is opened.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { /* ignore */ }
    if (seen) return;
    const id = window.setTimeout(() => {
      fire();
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    }, 450);
    return () => window.clearTimeout(id);
  }, [fire]);

  return (
    <>
      <div className="flex justify-end -mb-1">
        <button
          onClick={fire}
          title="Replay the welcome"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-cx-700 bg-cx-50 hover:bg-cx-100 border border-cx-200 transition-colors"
        >
          <PartyPopper className="w-3.5 h-3.5" />
          Replay
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" />

            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center border border-gray-100 shadow-2xl"
              variants={card} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95, y: 8 }}
            >
              <button
                onClick={close}
                className="absolute top-3 right-3 w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <motion.div variants={item} className="mx-auto mb-3 w-14 h-14 rounded-full bg-cx-50 flex items-center justify-center">
                <PartyPopper className="w-7 h-7 text-cx-600" />
              </motion.div>

              <motion.div variants={item} className="text-[10px] font-bold uppercase tracking-[0.2em] text-cx-600">
                Prime Day 2026 · wrapped
              </motion.div>

              <motion.h2 variants={item} className="text-xl font-extrabold text-gray-900 mt-1.5 leading-tight">
                One of the biggest promo events is done.
              </motion.h2>

              {/* Headline revenue — animates (counts up) on open */}
              <motion.div variants={item} className="mt-4 flex items-baseline justify-center gap-2">
                <motion.span className="text-4xl font-black text-gray-900 tabular-nums">{revText}</motion.span>
                <span className="text-sm font-bold text-emerald-700 inline-flex items-center gap-0.5">
                  <TrendingUp className="w-4 h-4" />+{revPct.toFixed(1)}%
                </span>
              </motion.div>

              <motion.p variants={item} className="text-[13px] text-gray-600 mt-3 leading-relaxed">
                Attribution is <span className="font-semibold text-gray-900">still settling</span>, so a few numbers will keep moving — but the heavy lifting is over.
                <br />
                <span className="font-semibold text-gray-900">Congrats to everyone.</span> Here's your recap.
              </motion.p>

              <motion.button
                variants={item}
                onClick={close}
                className="mt-5 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white bg-cx-600 hover:bg-cx-700 transition-colors"
              >
                Here's your recap
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
