// ─── Home "all green" celebration ────────────────────────────────────────────
// Tier 1 (headline KPIs all green): a brand-colour burst + side cannons and a
// clean congratulatory card. Tier 2 (every metric AND every period green): a
// more intense, sustained firework finale, a gradient "perfect board" card, and
// a counting-down rarity stat ("only 0.3% of brands…"). Fires once per tier on
// the first qualifying login; the Celebrate button replays it on demand.

import { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Trophy, PartyPopper, X } from 'lucide-react';
import { celebrationTier, seenTier, markSeen, TIER_STAT } from '../utils/homeCelebration';

const COLORS = ['#0E5A8A', '#4B9DCC', '#3889B8', '#10B981', '#FFD700'];

type Tier = 1 | 2;

export default function HomeCelebration() {
  const [active, setActive] = useState<Tier | null>(null);
  const cancelRef = useRef(false);

  const runConfetti = useCallback((tier: Tier) => {
    cancelRef.current = false;
    import('canvas-confetti').then(({ default: confetti }) => {
      // Center burst
      confetti({
        particleCount: tier === 2 ? 160 : 90,
        spread: tier === 2 ? 120 : 85,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.5 },
        colors: COLORS,
        disableForReducedMotion: true,
      });
      // Side cannons
      window.setTimeout(() => {
        if (cancelRef.current) return;
        confetti({ particleCount: tier === 2 ? 70 : 45, angle: 60, spread: 62, origin: { x: 0, y: 0.65 }, colors: COLORS, disableForReducedMotion: true });
        confetti({ particleCount: tier === 2 ? 70 : 45, angle: 120, spread: 62, origin: { x: 1, y: 0.65 }, colors: COLORS, disableForReducedMotion: true });
      }, 180);
      // Tier 2 only — sustained firework finale (~2.6s)
      if (tier === 2) {
        const end = Date.now() + 2600;
        const tick = () => {
          if (cancelRef.current || Date.now() > end) return;
          confetti({
            particleCount: 14, startVelocity: 30, spread: 360, ticks: 70,
            origin: { x: Math.random(), y: Math.random() * 0.5 },
            colors: COLORS, disableForReducedMotion: true,
          });
          window.setTimeout(tick, 220);
        };
        tick();
      }
    });
  }, []);

  const fire = useCallback((tier: Tier) => {
    setActive(tier);
    runConfetti(tier);
  }, [runConfetti]);

  const close = useCallback(() => {
    cancelRef.current = true;
    setActive(null);
  }, []);

  // Auto-fire on the first login that qualifies for a not-yet-seen tier.
  useEffect(() => {
    const t = celebrationTier();
    if (t > 0 && t > seenTier()) {
      const id = window.setTimeout(() => { fire(t as Tier); markSeen(t); }, 600);
      return () => window.clearTimeout(id);
    }
  }, [fire]);

  // Auto-dismiss the card after the confetti settles.
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(close, active === 2 ? 9000 : 6000);
    return () => window.clearTimeout(id);
  }, [active, close]);

  // The button replays the tier the data actually qualifies for; if nothing is
  // green yet, it previews the full tier-2 showcase.
  const handleTrigger = () => {
    const t = celebrationTier();
    fire(t === 0 ? 2 : (t as Tier));
  };

  return (
    <>
      <div className="flex justify-end -mt-1">
        <button
          onClick={handleTrigger}
          title="Preview the all-green celebration"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-cx-700 bg-cx-50 hover:bg-cx-100 border border-cx-200 transition-colors"
        >
          <PartyPopper className="w-3.5 h-3.5" />
          Celebrate
        </button>
      </div>
      {active && <CelebrationOverlay tier={active} onClose={close} />}
    </>
  );
}

// Eased count between two values (used for the tier-2 rarity stat).
function useCountTo(target: number, from: number, durationMs: number): number {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, from, durationMs]);
  return v;
}

function CelebrationOverlay({ tier, onClose }: { tier: Tier; onClose: () => void }) {
  const stat = TIER_STAT[tier];
  // Tier 2 counts down from a common figure to the rare one for an "elite" feel.
  const counted = useCountTo(stat, tier === 2 ? 9.9 : stat, 1300);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <style>{`
        @keyframes cxCelebPop { 0% { transform: scale(.82); opacity: 0 } 60% { transform: scale(1.03) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes cxCelebGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,.0), 0 18px 60px -12px rgba(14,90,138,.35) } 50% { box-shadow: 0 0 36px 4px rgba(245,158,11,.35), 0 18px 60px -12px rgba(16,185,129,.45) } }
        @keyframes cxCelebShimmer { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
      `}</style>

      <div
        className={`absolute inset-0 backdrop-blur-[2px] ${tier === 2 ? 'bg-slate-900/40' : 'bg-slate-900/25'}`}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl bg-white p-7 text-center ${tier === 2 ? 'border-2 border-transparent' : 'border border-emerald-200 shadow-2xl'}`}
        style={{
          animation: tier === 2
            ? 'cxCelebPop .45s ease-out, cxCelebGlow 2.4s ease-in-out infinite'
            : 'cxCelebPop .4s ease-out',
          ...(tier === 2 ? {
            backgroundImage: 'linear-gradient(white, white), linear-gradient(110deg, #0E5A8A, #10B981, #FFD700, #4B9DCC, #0E5A8A)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            backgroundSize: '100% 100%, 200% 100%',
            animationName: 'cxCelebPop, cxCelebGlow, cxCelebShimmer',
            animationDuration: '.45s, 2.4s, 4s',
            animationTimingFunction: 'ease-out, ease-in-out, linear',
            animationIterationCount: '1, infinite, infinite',
          } : {}),
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center ${tier === 2 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          {tier === 2
            ? <Trophy className="w-7 h-7 text-amber-500" />
            : <Sparkles className="w-7 h-7 text-emerald-500" />}
        </div>

        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${tier === 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {tier === 2 ? 'All-green · top 0.3% of brands' : 'Headline KPIs · all positive'}
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mt-1.5 leading-tight">
          {tier === 2
            ? 'Every metric is positive across all periods.'
            : 'All headline KPIs are positive.'}
        </h2>

        {tier === 2 ? (
          <>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black tabular-nums bg-gradient-to-r from-cx-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
                {counted.toFixed(1)}%
              </span>
            </div>
            <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
              Your portfolio is green across every metric and every period today — a level reached by the
              <span className="font-bold text-gray-900"> top 0.3% of brands</span> on Clarisix this period.
            </p>
          </>
        ) : (
          <p className="text-[13px] text-gray-600 mt-3 leading-relaxed">
            Every headline KPI is positive today — a position held by
            <span className="font-bold text-gray-900"> {stat}% of brands</span> on Clarisix this period.
          </p>
        )}

        <button
          onClick={onClose}
          className={`mt-5 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors ${tier === 2 ? 'bg-gray-900 hover:bg-gray-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
