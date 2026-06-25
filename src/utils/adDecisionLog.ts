// ─── Advertising Decision Log ────────────────────────────────────────────────
// Clarisix doesn't execute ad changes — it recommends them. This store records
// the seller's DECISION on each recommendation (Accept / Snooze / Dismiss) with
// a timestamp, so the next period can measure the before/after impact and close
// the loop. Module-level store + localStorage so the demo survives reloads and
// any component can read/write without prop threading.

import { useSyncExternalStore } from 'react';

export type DecisionAction = 'accepted' | 'snoozed' | 'dismissed';

export interface DecisionLogEntry {
  key: string;            // entity key (e.g. camp:0, kw:3)
  name: string;
  kindLabel: string;      // Campaign / Keyword / ...
  decision: string;       // Scale / Fix / Pause / ...
  issue: string;
  recommendation: string; // the advisory next step we logged against
  action: DecisionAction;
  at: number;             // epoch ms when the decision was logged
}

const LS_KEY = 'cx_ad_decision_log';

function load(): Record<string, DecisionLogEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

let entries: Record<string, DecisionLogEntry> = load();
const listeners = new Set<() => void>();

function emit() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch { /* ignore quota */ }
  listeners.forEach((l) => l());
}

export function recordDecision(entry: Omit<DecisionLogEntry, 'at'>) {
  entries = { ...entries, [entry.key]: { ...entry, at: Date.now() } };
  emit();
}

export function clearDecision(key: string) {
  if (!(key in entries)) return;
  const next = { ...entries };
  delete next[key];
  entries = next;
  emit();
}

export function clearAllDecisions() {
  if (Object.keys(entries).length === 0) return;
  entries = {};
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot() { return entries; }

/** Reactive read of the whole log (keyed by entity key). */
export function useAdDecisionLog(): Record<string, DecisionLogEntry> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const ACTION_LABEL: Record<DecisionAction, string> = {
  accepted: 'Accepted',
  snoozed: 'Snoozed',
  dismissed: 'Dismissed',
};
