// ─── Home "all green" celebration — detection & gating ───────────────────────
// Tier 1: every main KPI card is green (kpi.popPositive).
// Tier 2: tier 1 AND every Period Snapshot cell is green (changePositive, non-neutral).
// The auto-celebration fires once per tier on the first qualifying login
// (localStorage-gated); the manual trigger button can replay it any time.

import { kpiData, periodSnapshots } from '../data/dashboardData';

export type CelebrationTier = 0 | 1 | 2;

export function allKpisGreen(): boolean {
  return kpiData.every((k) => k.popPositive === true);
}

export function allGreenIncludingSnapshot(): boolean {
  if (!allKpisGreen()) return false;
  // A snapshot cell is "green" when it's positive AND not neutral (change ≠ 0).
  return periodSnapshots.every((p) =>
    Object.values(p.metrics).every((m) => m.changePositive === true && (m.change ?? 0) !== 0),
  );
}

export function celebrationTier(): CelebrationTier {
  if (allGreenIncludingSnapshot()) return 2;
  if (allKpisGreen()) return 1;
  return 0;
}

// "Only X% of brands are seeing this green today" — rarer for the perfect board.
export const TIER_STAT: Record<1 | 2, number> = { 1: 4.1, 2: 0.3 };

const LS_KEY = 'cx_home_celebration_seen';

export function seenTier(): number {
  try { return Number(localStorage.getItem(LS_KEY)) || 0; } catch { return 0; }
}

export function markSeen(tier: number) {
  try { localStorage.setItem(LS_KEY, String(Math.max(seenTier(), tier))); } catch { /* ignore */ }
}
