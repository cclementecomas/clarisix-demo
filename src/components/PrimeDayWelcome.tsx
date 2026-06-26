// ─── Prime Day Recap — first-open welcome ────────────────────────────────────
// A one-time, "wow" welcome shown the first time the recap is opened. Framer
// Motion (motion/react) drives the staging — a radial brand-glow blooms behind a
// spring-in card, content staggers up, the headline revenue counts up with a
// pop, and a light sheen sweeps across the card — while canvas-confetti fires a
// choreographed burst (center → side cannons → golden finale + a brief sparkle
// fall). Fires once (localStorage); the "Replay" pill re-triggers it.

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { PartyPopper, TrendingUp, X } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import { primeDayRevenue, pctDelta } from '../data/primeDayData';

const SEEN_KEY = 'clarisix_prime_day_welcome_seen';
const COLORS = ['#0E5A8A', '#4B9DCC', '#3889B8', '#10B981', '#FFD700'];
const GOLD = ['#FFD700', '#FDE68A', '#F59E0B', '#FFFFFF'];

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
  const cancelRef = useRef(false);

  const revPct = pctDelta(primeDayRevenue.thisYear, primeDayRevenue.lastYear);
  const count = useMotionValue(0);
  const revText = useTransform(count, (v) => fc(Math.round(v), currency, { compact: true }));

  // Choreographed confetti: center burst → side cannons → golden finale →
  // a short sparkle fall. Timed to the card spring + revenue count-up.
  const runConfetti = useCallback(() => {
    cancelRef.current = false;
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 130, spread: 100, startVelocity: 46, origin: { x: 0.5, y: 0.52 }, colors: COLORS, disableForReducedMotion: true });
      window.setTimeout(() => {
        if (cancelRef.current) return;
        confetti({ particleCount: 60, angle: 60, spread: 64, startVelocity: 52, origin: { x: 0, y: 0.68 }, colors: COLORS, disableForReducedMotion: true });
        confetti({ particleCount: 60, angle: 120, spread: 64, startVelocity: 52, origin: { x: 1, y: 0.68 }, colors: COLORS, disableForReducedMotion: true });
      }, 180);
      // Golden finale — lands as the revenue number pops.
      window.setTimeout(() => {
        if (cancelRef.current) return;
        confetti({ particleCount: 90, spread: 130, startVelocity: 40, scalar: 1.1, ticks: 220, origin: { x: 0.5, y: 0.42 }, colors: GOLD, disableForReducedMotion: true });
      }, 620);
      // Brief sparkle fall (~1.8s) for a scenic, sustained finish.
      const end = Date.now() + 1800;
      const tick = () => {
        if (cancelRef.current || Date.now() > end) return;
        confetti({ particleCount: 10, startVelocity: 18, spread: 70, ticks: 130, gravity: 0.7, scalar: 0.85, origin: { x: Math.random(), y: -0.05 }, colors: GOLD, disableForReducedMotion: true });
        window.setTimeout(tick, 240);
      };
      window.setTimeout(tick, 700);
    });
  }, []);

  const fire = useCallback(() => {
    setOpen(true);
    runConfetti();
  }, [runConfetti]);

  const close = useCallback(() => {
    cancelRef.current = true;
    setOpen(false);
  }, []);

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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden"
            onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]" />

            {/* Scenic radial brand-glow blooming behind the card */}
            <motion.div
              className="absolute w-[680px] h-[680px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(75,157,204,0.45) 0%, rgba(14,90,138,0.25) 35%, rgba(14,90,138,0) 70%)' }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.9, 0.6], scale: [0.4, 1.05, 1] }}
              transition={{ duration: 1.6, ease: 'easeOut', times: [0, 0.5, 1] }}
            />

            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center border border-gray-100 shadow-2xl overflow-hidden"
              variants={card} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95, y: 8 }}
            >
              {/* Light sheen sweeping across the card */}
              <motion.div
                className="absolute top-0 bottom-0 w-1/3 pointer-events-none"
                style={{ background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.65), transparent)' }}
                initial={{ x: '-160%' }}
                animate={{ x: '360%' }}
                transition={{ delay: 0.55, duration: 1.0, ease: 'easeInOut' }}
              />

              <button
                onClick={close}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <motion.div
                className="mx-auto mb-3 w-14 h-14 rounded-full bg-cx-50 flex items-center justify-center"
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.18 }}
              >
                <PartyPopper className="w-7 h-7 text-cx-600" />
              </motion.div>

              <motion.div variants={item} className="text-[10px] font-bold uppercase tracking-[0.2em] text-cx-600">
                Prime Day 2026 · wrapped
              </motion.div>

              <motion.h2 variants={item} className="text-xl font-extrabold text-gray-900 mt-1.5 leading-tight">
                One of the biggest promo events is done.
              </motion.h2>

              {/* Headline revenue — counts up with a pop on open */}
              <motion.div variants={item} className="mt-4 flex items-baseline justify-center gap-2">
                <motion.span
                  className="text-4xl font-black text-gray-900 tabular-nums"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [0.6, 1.14, 1], opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.7, ease: 'easeOut' }}
                >
                  {revText}
                </motion.span>
                <motion.span
                  className="text-sm font-bold text-emerald-700 inline-flex items-center gap-0.5"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.95 }}
                >
                  <TrendingUp className="w-4 h-4" />+{revPct.toFixed(1)}%
                </motion.span>
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
