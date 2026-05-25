import { useMemo, useState } from 'react';
import { Tag, ShieldCheck, Swords, FolderTree, Ruler, Sparkles, X, Plus, Info, ArrowRight, ChevronRight } from 'lucide-react';
import {
  deriveBrands,
  defaultRulesState,
  classifyQuery,
  INTENT_LABELS,
  INTENT_COLORS,
  type KeywordRulesState,
} from '../../data/keywordRulesData';

/**
 * Settings → Data → Keyword rules
 *
 * Lets the user define the rules that classify SQP queries into intent
 * buckets (Branded / Competitor / Long-tail / Category / Generic).
 *
 * - "My brands" is derived from Products mapping (read-only here).
 * - Brand variants, competitors and category keywords are editable lists.
 * - Long-tail threshold is a word-count slider.
 * - The classification preview lets the user test a sample query.
 *
 * State is kept local — wire to context later when the SQP intent filter
 * is migrated off hardcoded values.
 */
export default function KeywordRulesSection() {
  const brands = useMemo(() => deriveBrands(), []);
  const [state, setState] = useState<KeywordRulesState>(() => {
    const base = { ...defaultRulesState };
    // Ensure every derived brand has a variants entry (possibly empty).
    const variants: Record<string, string[]> = {};
    for (const b of brands) variants[b] = base.brandVariants[b] ?? [];
    return { ...base, brandVariants: variants };
  });

  /* ── Brand variant editors ─────────────────────────────── */
  const addVariant = (brand: string, term: string) => {
    const t = term.trim().toLowerCase();
    if (!t) return;
    setState((s) => {
      const current = s.brandVariants[brand] ?? [];
      if (current.includes(t)) return s;
      return { ...s, brandVariants: { ...s.brandVariants, [brand]: [...current, t] } };
    });
  };
  const removeVariant = (brand: string, term: string) => {
    setState((s) => ({
      ...s,
      brandVariants: {
        ...s.brandVariants,
        [brand]: (s.brandVariants[brand] ?? []).filter((v) => v !== term),
      },
    }));
  };

  /* ── Competitor + Category editors ─────────────────────── */
  const addCompetitor = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setState((s) => (s.competitors.includes(t) ? s : { ...s, competitors: [...s.competitors, t] }));
  };
  const removeCompetitor = (term: string) =>
    setState((s) => ({ ...s, competitors: s.competitors.filter((c) => c !== term) }));

  const addCategoryKw = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setState((s) => (s.categoryKeywords.includes(t) ? s : { ...s, categoryKeywords: [...s.categoryKeywords, t] }));
  };
  const removeCategoryKw = (term: string) =>
    setState((s) => ({ ...s, categoryKeywords: s.categoryKeywords.filter((c) => c !== term) }));

  /* ── Long-tail threshold ───────────────────────────────── */
  const setThreshold = (n: number) => setState((s) => ({ ...s, longTailThreshold: n }));

  return (
    <div className="space-y-6">
      {/* Header card with rule order */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-cx-500" />
            <h2 className="text-base font-semibold text-gray-900">Keyword rules</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Rules that classify SQP queries into intent buckets. Used by the intent filter on
            the Search Query Performance page and by intent-based reports across Sales and Advertising.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50/60 border-b border-gray-100">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700">Evaluation order (first match wins):</span>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {(['branded', 'competitor', 'longTail', 'category', 'generic'] as const).map((intent, i, arr) => {
                  const c = INTENT_COLORS[intent];
                  return (
                    <div key={intent} className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text} ring-1 ring-inset ${c.ring}`}>
                        {i + 1}. {INTENT_LABELS[intent]}
                      </span>
                      {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My brands + variants */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-900">My brands</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                From Products
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Brands are derived automatically from your Products mapping. Add variants below
              to catch misspellings and international spellings in SQP queries
              (e.g. "ZeroWater" → also match "zero water", "0water").
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {brands.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-xs text-gray-500">
                No brands found in Products mapping. Add brands in{' '}
                <span className="font-semibold text-gray-700">Data → Products</span> first.
              </p>
            </div>
          ) : (
            brands.map((brand) => (
              <BrandVariantsRow
                key={brand}
                brand={brand}
                variants={state.brandVariants[brand] ?? []}
                onAdd={(v) => addVariant(brand, v)}
                onRemove={(v) => removeVariant(brand, v)}
              />
            ))
          )}
        </div>
      </div>

      {/* Competitors */}
      <ChipListCard
        icon={<Swords className="w-4 h-4 text-rose-500" />}
        title="Competitor brands"
        description="Manually maintained list of competitor brand names. A query containing any of these is classified as Competitor."
        emptyHint="Add a competitor brand (e.g. brita)"
        items={state.competitors}
        chipClass="bg-rose-50 text-rose-700 ring-rose-200"
        onAdd={addCompetitor}
        onRemove={removeCompetitor}
        placeholder="e.g. brita, pur, aquasana"
      />

      {/* Category keywords */}
      <ChipListCard
        icon={<FolderTree className="w-4 h-4 text-sky-500" />}
        title="Category keywords"
        description="Generic product-category terms. A query containing any of these (and not matching earlier rules) is classified as Category."
        emptyHint="Add a category keyword"
        items={state.categoryKeywords}
        chipClass="bg-sky-50 text-sky-700 ring-sky-200"
        onAdd={addCategoryKw}
        onRemove={removeCategoryKw}
        placeholder="e.g. water filter, knee brace"
      />

      {/* Long-tail threshold */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">Long-tail threshold</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Queries with at least this many words are classified as Long-tail (unless a brand or
            competitor rule matches first).
          </p>
        </div>
        <div className="px-6 py-5 flex items-center gap-4">
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={state.longTailThreshold}
            onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            className="flex-1 max-w-md accent-cx-500"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{state.longTailThreshold}</span>
            <span className="text-xs text-gray-500">words</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[11px] text-gray-400">2</span>
            <span className="text-[11px] text-gray-300">–</span>
            <span className="text-[11px] text-gray-400">8</span>
          </div>
        </div>
      </div>

      {/* Preview / tester */}
      <ClassificationPreview state={state} />
    </div>
  );
}

/* ───────────────────────────── Sub-components ───────────────────────────── */

function BrandVariantsRow({
  brand,
  variants,
  onAdd,
  onRemove,
}: {
  brand: string;
  variants: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [input, setInput] = useState('');

  const submit = () => {
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start gap-4">
        <div className="w-40 flex-shrink-0 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-xs font-semibold">{brand}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {variants.length === 0 && (
              <span className="text-[11px] text-gray-400 italic">No variants — only "{brand.toLowerCase()}" will match</span>
            )}
            {variants.map((v) => (
              <Chip key={v} label={v} chipClass="bg-emerald-50 text-emerald-700 ring-emerald-200" onRemove={() => onRemove(v)} />
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={`Add variant for ${brand}…`}
              className="flex-1 max-w-xs px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none"
            />
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cx-700 bg-cx-50 hover:bg-cx-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipListCard({
  icon, title, description, emptyHint, items, chipClass, onAdd, onRemove, placeholder,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  emptyHint: string;
  items: string[];
  chipClass: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const submit = () => {
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-[10px] font-medium text-gray-400 tabular-nums ml-1">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
          {items.length === 0 && <span className="text-[11px] text-gray-400 italic">{emptyHint}</span>}
          {items.map((it) => (
            <Chip key={it} label={it} chipClass={chipClass} onRemove={() => onRemove(it)} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            className="flex-1 max-w-xs px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none"
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cx-700 bg-cx-50 hover:bg-cx-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, chipClass, onRemove }: { label: string; chipClass: string; onRemove: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset ${chipClass}`}>
      {label}
      <button
        onClick={onRemove}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded hover:bg-black/5"
        aria-label={`Remove ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function ClassificationPreview({ state }: { state: KeywordRulesState }) {
  const [query, setQuery] = useState('zerowater filter replacement 6 pack');
  const result = useMemo(() => classifyQuery(query, state), [query, state]);
  const color = INTENT_COLORS[result.intent];

  const examples = [
    'zerowater filter replacement 6 pack',
    'brita pitcher replacement',
    'best knee brace for running',
    'water pitcher',
    'led strip',
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Classification preview</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Type a sample SQP query to see which rule matches and which intent it would be assigned.
        </p>
      </div>
      <div className="px-6 py-5 space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a search query…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cx-500/20 focus:border-cx-500 outline-none"
        />

        <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Result</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ring-1 ring-inset ${color.bg} ${color.text} ${color.ring}`}>
            {INTENT_LABELS[result.intent]}
          </span>
          <span className="text-xs text-gray-600 flex-1 min-w-0">{result.reason}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Try</span>
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuery(ex)}
              className="text-[11px] text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-md"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
