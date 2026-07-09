import type { Quadrant } from '../../lib/sqp/types';

export const QUADRANT_META: Record<Quadrant, { label: string; action: string; chip: string; dot: string; fill: string }> = {
  invest:  { label: 'Invest',  action: 'Increase visibility',   chip: 'bg-amber-50 text-amber-700 ring-amber-200',   dot: '#F59E0B', fill: 'rgba(245, 158, 11, 0.08)' },
  defend:  { label: 'Defend',  action: 'Protect share, hold rank', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: '#10B981', fill: 'rgba(16, 185, 129, 0.07)' },
  harvest: { label: 'Harvest', action: 'Maintain, optimize',     chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: '#6366F1', fill: 'rgba(99, 102, 241, 0.06)' },
  tail:    { label: 'Tail',    action: 'Ignore or test cheaply', chip: 'bg-slate-50 text-slate-600 ring-slate-200',   dot: '#94A3B8', fill: 'rgba(148, 163, 184, 0.07)' },
};
