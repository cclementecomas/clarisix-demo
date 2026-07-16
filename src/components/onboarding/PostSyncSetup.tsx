import { useState } from 'react';
import { ShieldCheck, Boxes, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';
import { DISCOVERED_ACTIVE_PRODUCTS as N } from '../../data/connectionsData';
import CategoryMappingStep from './steps/CategoryMappingStep';

interface Plan { id: string; name: string; priceMo: number | null; upTo: number; blurb: string; }
const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', priceMo: 49,  upTo: 250,      blurb: 'For focused catalogues' },
  { id: 'growth',  name: 'Growth',  priceMo: 129, upTo: 1000,     blurb: 'For growing brands' },
  { id: 'scale',   name: 'Scale',   priceMo: 299, upTo: 5000,     blurb: 'For multi-brand sellers' },
  { id: 'enterprise', name: 'Enterprise', priceMo: null, upTo: Infinity, blurb: 'For agencies & aggregators' },
];

function PlanChoice({ onContinue }: { onContinue: () => void }) {
  const { currency } = useCurrency();
  const [cycle, setCycle] = useState<'annual' | 'monthly'>('annual');
  const recommendedIdx = PLANS.findIndex((p) => N <= p.upTo);
  const [selected, setSelected] = useState(PLANS[recommendedIdx]?.id ?? 'growth');

  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your data's in — here's your plan</h1>
        <p className="text-gray-500 text-sm mt-1.5 max-w-lg mx-auto">
          Clarisix is priced on active products, so we waited until your catalog was fully loaded to show you the right plan.
        </p>
      </div>

      {/* discovered + billing promise */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-5">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0"><Boxes className="w-5 h-5 text-emerald-600" /></div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-emerald-900"><span className="tabular-nums">{N}</span> active products found across your catalogue</div>
          <div className="text-[12px] text-emerald-700/90 mt-0.5">You weren't charged a cent while we loaded — every source is now fetched and validated, so your subscription starts today.</div>
        </div>
      </div>

      {/* billing cycle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
          {(['annual', 'monthly'] as const).map((c) => (
            <button key={c} onClick={() => setCycle(c)} className={`px-3 py-1.5 text-[12px] font-semibold rounded-md capitalize transition-colors ${cycle === c ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {c}{c === 'annual' && <span className={`ml-1 ${cycle === 'annual' ? 'text-emerald-300' : 'text-emerald-600'}`}>−20%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLANS.map((p, i) => {
          const isRec = i === recommendedIdx;
          const isSel = selected === p.id;
          const mo = p.priceMo == null ? null : cycle === 'annual' ? Math.round(p.priceMo * 0.8) : p.priceMo;
          return (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={`text-left rounded-xl border p-3.5 transition-all relative ${isSel ? 'border-cx-400 ring-2 ring-cx-400/30 bg-cx-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
              {isRec && <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wide text-white bg-cx-600 rounded px-1.5 py-0.5">Recommended</span>}
              <div className="text-sm font-bold text-gray-900">{p.name}</div>
              <div className="text-[10px] text-gray-400 mb-2">{p.blurb}</div>
              {mo == null ? (
                <div className="text-lg font-bold text-gray-900">Custom</div>
              ) : (
                <div className="flex items-baseline gap-0.5"><span className="text-lg font-bold text-gray-900 tabular-nums">{fc(mo, currency, { compact: false })}</span><span className="text-[11px] text-gray-400">/mo</span></div>
              )}
              <div className="text-[10px] text-gray-500 mt-1.5">{p.upTo === Infinity ? 'Unlimited products' : `Up to ${p.upTo.toLocaleString()} products`}</div>
              {isRec && <div className="text-[10px] font-semibold text-cx-700 mt-1">{N} of {p.upTo.toLocaleString()} used</div>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center">
        <button onClick={onContinue} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-cx-500 hover:bg-cx-600 text-white text-sm font-semibold shadow-sm">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Cancel or change plan anytime · products are counted monthly.</p>
    </div>
  );
}

export default function PostSyncSetup({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState<'plan' | 'mapping'>('plan');

  if (step === 'plan') return <PlanChoice onContinue={() => setStep('mapping')} />;

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <CategoryMappingStep />
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <button onClick={onFinish} className="text-sm font-medium text-gray-500 hover:text-gray-700">Skip for now</button>
        <button onClick={onFinish} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-cx-600 hover:bg-cx-700 text-white text-sm font-semibold shadow-sm">
          Enter your dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
