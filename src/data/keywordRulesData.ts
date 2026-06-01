import { seedMappings } from './productMappingData';

/**
 * Keyword classification rules
 * ─────────────────────────────
 * Rule evaluation order (first match wins):
 *   1. branded     — query contains my brand or any registered variant
 *   2. competitor  — query contains a competitor brand
 *   3. longTail    — query word count >= longTailThreshold
 *   4. category    — query contains a category keyword
 *   5. generic     — none of the above
 *
 * Brand list is derived from Products mapping (read-only). Users add
 * variants (typos / international spellings) to catch misspellings in
 * Brand Analytics SQP data. Competitors and category keywords are
 * fully user-managed.
 */

export type KeywordIntent = 'branded' | 'competitor' | 'longTail' | 'category' | 'generic';

export interface KeywordRulesState {
  /** Per-brand variant lists. Keys are brand names derived from Products mapping. */
  brandVariants: Record<string, string[]>;
  /** Free-form list of competitor brand names. */
  competitors: string[];
  /** Free-form list of category keywords/phrases. */
  categoryKeywords: string[];
  /** Min word count for a query to be classified as long-tail. */
  longTailThreshold: number;
}

/** Brands derived from the Products mapping. Order is preserved by first-seen. */
export function deriveBrands(): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const m of seedMappings) {
    const b = (m.brand ?? '').trim();
    if (b && !seen.has(b)) {
      seen.add(b);
      list.push(b);
    }
  }
  return list;
}

export const defaultRulesState: KeywordRulesState = {
  brandVariants: {
    ZeroWater:  ['zero water', 'zerowater', '0water', 'zero-water'],
    Zamst:      ['zamst', 'zamsts'],
    BrightLife: ['bright life', 'brightlife', 'brite life'],
    ClearPath:  ['clear path', 'clearpath'],
  },
  competitors: [
    'brita', 'pur', 'aquasana', 'mcdavid', 'shock doctor', 'philips hue',
  ],
  categoryKeywords: [
    'water filter', 'water pitcher', 'knee brace', 'ankle support',
    'smart bulb', 'led strip', 'travel bag', 'backpack',
  ],
  longTailThreshold: 4,
};

export interface ClassificationResult {
  intent: KeywordIntent;
  /** Short human-readable reason for the classification. */
  reason: string;
  /** The brand matched, if any (only for `branded`). */
  matchedBrand?: string;
  /** The exact substring that triggered the rule. */
  matchedTerm?: string;
}

export function classifyQuery(query: string, state: KeywordRulesState): ClassificationResult {
  const q = query.toLowerCase().trim();
  if (!q) return { intent: 'generic', reason: 'Empty query' };

  // 1. Branded — match canonical brand name or any registered variant.
  for (const [brand, variants] of Object.entries(state.brandVariants)) {
    const candidates = [brand.toLowerCase(), ...variants.map((v) => v.toLowerCase())];
    for (const c of candidates) {
      if (c && q.includes(c)) {
        return {
          intent: 'branded',
          reason: `Contains "${c}" → matches ${brand}`,
          matchedBrand: brand,
          matchedTerm: c,
        };
      }
    }
  }

  // 2. Competitor
  for (const c of state.competitors) {
    const cc = c.toLowerCase();
    if (cc && q.includes(cc)) {
      return {
        intent: 'competitor',
        reason: `Contains competitor "${cc}"`,
        matchedTerm: cc,
      };
    }
  }

  // 3. Long-tail (by word count)
  const wordCount = q.split(/\s+/).filter(Boolean).length;
  if (wordCount >= state.longTailThreshold) {
    return {
      intent: 'longTail',
      reason: `${wordCount} words ≥ threshold of ${state.longTailThreshold}`,
    };
  }

  // 4. Category
  for (const k of state.categoryKeywords) {
    const kk = k.toLowerCase();
    if (kk && q.includes(kk)) {
      return {
        intent: 'category',
        reason: `Contains category term "${kk}"`,
        matchedTerm: kk,
      };
    }
  }

  // 5. Generic fallback
  return {
    intent: 'generic',
    reason: 'No rule matched',
  };
}

export const INTENT_LABELS: Record<KeywordIntent, string> = {
  branded:    'Branded',
  competitor: 'Competitor',
  longTail:   'Long-tail',
  category:   'Category',
  generic:    'Generic',
};

export const INTENT_COLORS: Record<KeywordIntent, { bg: string; text: string; ring: string }> = {
  branded:    { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  competitor: { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200' },
  longTail:   { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200' },
  category:   { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-200' },
  generic:    { bg: 'bg-gray-100',   text: 'text-gray-700',    ring: 'ring-gray-200' },
};
