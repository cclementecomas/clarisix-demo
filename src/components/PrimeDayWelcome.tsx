// ─── Prime Day Recap — first-open welcome ("Prime Day, Wrapped") ─────────────
// A one-time, branded Spotify-Wrapped-style reveal shown the first time the
// recap is opened. Three beats, built on Framer Motion (motion/react), on a dark
// immersive card:
//   1. Wrap    — the Clarisix mark spins up and decelerates to a lock while we
//                "wrap" the event (honest: attribution is still settling).
//   2. Ring    — a single gold ring draws around the mark with a glow bloom.
//                (No confetti, no shockwave — one meaningful effect.)
//   3. Reveal  — the headline revenue rolls up odometer-style, with grounded
//                year-over-year stats (no all-time claims) and a share hand-off.
// Gated on a positive event (never celebrate a down year). Fires once
// (localStorage); a "Replay" pill re-triggers it.

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { TrendingUp, Share2, ArrowRight, X, Sparkles, Check } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { fc } from '../utils/currency';
import { primeDayRevenue, pctDelta, primeDayMeta, primeDayMovers } from '../data/primeDayData';
import { buildSummaryCanvas } from '../utils/primeDayShare';
import { preloadLogo, copyCanvas } from '../utils/brandedShare';

const SEEN_KEY = 'clarisix_prime_day_welcome_seen';
const SPIN_END = 1080; // 3 full turns — multiple of 360 so the mark lands aligned

const reveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 24 } },
};

// ── Odometer ─ each digit rolls up to its final value; separators/symbol static
function Odometer({ text, start }: { text: string; start: boolean }) {
  return (
    <span className="inline-flex text-[44px] font-black text-white tabular-nums" style={{ lineHeight: 1 }}>
      {text.split('').map((ch, i) => {
        const isDigit = ch >= '0' && ch <= '9';
        return (
          <span key={i} className="inline-block overflow-hidden" style={{ height: '1em' }}>
            {isDigit ? (
              <motion.span
                className="flex flex-col"
                initial={{ y: 0 }}
                animate={{ y: start ? `-${Number(ch)}em` : 0 }}
                transition={{ delay: 0.04 * i, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n} style={{ height: '1em', lineHeight: 1 }}>{n}</span>
                ))}
              </motion.span>
            ) : (
              <span style={{ height: '1em', lineHeight: 1 }}>{ch}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function PrimeDayWelcome() {
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'tally' | 'reveal'>('tally');
  const [shared, setShared] = useState<string | null>(null);
  const spin = useMotionValue(0);
  const timers = useRef<number[]>([]);

  const rev = primeDayRevenue;
  const revPct = pctDelta(rev.thisYear, rev.lastYear);
  const revAbs = rev.thisYear - rev.lastYear;
  // Only celebrate a positive event — never a down year.
  const performancePositive = revPct > 0;

  const fullRev = fc(rev.thisYear, currency, { compact: false, decimals: 0 });

  // Personalized accolade — the record category by € growth.
  const topCat = useMemo(() => {
    const cats = primeDayMovers.find((d) => d.key === 'category')!.rows;
    return [...cats].map((r) => ({ name: r.name, delta: r.thisYearRev - r.lastYearRev }))
      .sort((a, b) => b.delta - a.delta)[0];
  }, []);

  const clearTimers = useCallback(() => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; }, []);

  const fire = useCallback(() => {
    clearTimers();
    setShared(null);
    setPhase('tally');
    setOpen(true);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    spin.set(0);
    if (reduced) {
      spin.set(SPIN_END);
      timers.current.push(window.setTimeout(() => setPhase('reveal'), 150));
      return;
    }
    // Spin up fast then decelerate to a clean stop (lands aligned at SPIN_END).
    animate(spin, SPIN_END, { duration: 1.3, ease: [0.22, 1, 0.36, 1] });
    timers.current.push(window.setTimeout(() => setPhase('reveal'), 1250));
  }, [spin, clearTimers]);

  const close = useCallback(() => { clearTimers(); setOpen(false); }, [clearTimers]);

  // Animate the count alongside the odometer is unnecessary — the odometer rolls
  // itself; nothing else to drive here.

  // Auto-fire once, the first time the page is opened — only on a positive event.
  useEffect(() => {
    if (!performancePositive) return;
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { /* ignore */ }
    if (seen) return;
    const id = window.setTimeout(() => {
      fire();
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    }, 450);
    return () => window.clearTimeout(id);
  }, [fire, performancePositive]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Preload the logo up front so the share click can write to the clipboard
  // within the user-gesture window (an async load here would break it).
  useEffect(() => { preloadLogo(); }, []);

  const handleShare = useCallback(async () => {
    try {
      const fname = `clarisix-prime-day-recap-${new Date().toISOString().slice(0, 10)}.png`;
      const r = await copyCanvas(buildSummaryCanvas(currency), fname);
      setShared(r === 'clipboard' ? 'Copied — paste anywhere' : 'Saved PNG');
    } catch {
      setShared('Could not share');
    }
    timers.current.push(window.setTimeout(() => setShared(null), 2600));
  }, [currency]);

  // No celebration on a flat or negative event — render nothing at all.
  if (!performancePositive) return null;

  return (
    <>
      <div className="flex justify-end -mb-1">
        <button
          onClick={fire}
          title="Replay the welcome"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-cx-700 bg-cx-50 hover:bg-cx-100 border border-cx-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
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
            {/* Cinematic dark stage */}
            <motion.div
              className="absolute inset-0 backdrop-blur-[3px]"
              initial={{ backgroundColor: 'rgba(2,6,23,0)' }}
              animate={{ backgroundColor: 'rgba(2,6,23,0.8)' }}
              exit={{ backgroundColor: 'rgba(2,6,23,0)' }}
              transition={{ duration: 0.5 }}
            />

            {/* Gold glow bloom — lands with the seal */}
            <motion.div
              className="absolute w-[620px] h-[620px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.30) 0%, rgba(16,185,129,0.10) 38%, rgba(16,185,129,0) 68%)' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={phase === 'reveal' ? { opacity: [0, 0.95, 0.7], scale: [0.5, 1.06, 1] } : { opacity: 0, scale: 0.5 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl bg-slate-900 shadow-2xl border border-white/10 overflow-hidden"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <button
                onClick={close}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* ── Mark + Wrapped ring ── */}
              <div className="relative flex flex-col items-center pt-10 pb-2 px-7">
                <div className="relative w-[132px] h-[132px] flex items-center justify-center">
                  {/* Gold seal ring — draws once on reveal */}
                  <svg className="absolute inset-0" viewBox="0 0 132 132">
                    <circle
                      cx="66" cy="66" r="56" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"
                      style={{
                        strokeDasharray: 2 * Math.PI * 56,
                        strokeDashoffset: phase === 'reveal' ? 0 : 2 * Math.PI * 56,
                        transform: 'rotate(-90deg)', transformOrigin: 'center',
                        transition: 'stroke-dashoffset 0.75s cubic-bezier(0.16,1,0.3,1) 0.05s',
                        filter: phase === 'reveal' ? 'drop-shadow(0 0 6px rgba(16,185,129,0.65))' : 'none',
                      }}
                    />
                  </svg>
                  {/* Clarisix mark — spins up, decelerates, then a lock pop */}
                  <motion.div
                    animate={phase === 'reveal' ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                  >
                    <motion.img
                      src="/Untitled_design_(3).png"
                      alt="Clarisix"
                      className="w-[78px] h-[78px] select-none"
                      style={{ rotate: spin }}
                      draggable={false}
                    />
                  </motion.div>
                </div>

                <div className="h-5 mt-4 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {phase === 'tally' ? (
                      <motion.span
                        key="wrap"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-[12px] font-medium tracking-wide text-slate-300"
                      >
                        Wrapping your Prime Day…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="wrapped"
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400"
                      >
                        Prime Day 2026 · Wrapped
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Reveal (white) ── */}
              <AnimatePresence>
                {phase === 'reveal' && (
                  <motion.div
                    className="px-7 pt-4 pb-8 text-center"
                    variants={reveal} initial="hidden" animate="visible"
                  >
                    <motion.div variants={item}>
                      <Odometer text={fullRev} start={phase === 'reveal'} />
                    </motion.div>

                    <motion.div variants={item} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mt-2">
                      in Prime Day revenue
                    </motion.div>

                    <motion.div variants={item} className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-bold text-emerald-400 tabular-nums">
                      <TrendingUp className="w-4 h-4" />
                      +{revPct.toFixed(1)}% vs {primeDayMeta.lastYearLabel} · +{fc(revAbs, currency, { compact: true })}
                    </motion.div>

                    <motion.div variants={item} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Top growth driver: {topCat.name} +{fc(topCat.delta, currency, { compact: true })}
                    </motion.div>

                    <motion.p variants={item} className="text-[12px] text-slate-400 mt-4 leading-relaxed">
                      Attribution's still settling, so a few numbers will keep climbing.
                      <span className="font-semibold text-slate-200"> Congrats to the whole team.</span>
                    </motion.p>

                    <motion.div variants={item} className="mt-5 flex items-center gap-2">
                      <button
                        onClick={close}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors"
                      >
                        See the full recap <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleShare}
                        title="Copy a branded recap image to paste in Slack or email"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
                      >
                        {shared ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                        {shared ?? 'Share this win'}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
