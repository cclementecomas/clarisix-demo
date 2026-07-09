import InfoTooltip from '../InfoTooltip';

export type Brand = 'all' | 'branded' | 'nonbranded';
const OPTS: { v: Brand; label: string }[] = [{ v: 'all', label: 'All' }, { v: 'nonbranded', label: 'Non-branded' }, { v: 'branded', label: 'Branded' }];

export default function BrandedToggle({ value, onChange }: { value: Brand; onChange: (b: Brand) => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center bg-gray-100 rounded-md p-0.5">
        {OPTS.map((o) => (
          <button key={o.v} onClick={() => onChange(o.v)} className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all ${value === o.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{o.label}</button>
        ))}
      </div>
      <InfoTooltip content="Branded terms have inflated CTR & CVR (the shopper already wanted you) and mask true listing / PPC performance. Analyse non-branded to judge new-audience performance." wide />
    </div>
  );
}
