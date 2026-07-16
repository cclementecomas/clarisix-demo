import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useWizard } from '../../../contexts/OnboardingWizardContext';
import {
  marketplaceOptions,
  currencyOptions,
  toolOptions,
} from '../../../data/onboardingWizardData';

function MarketplaceChipSelector() {
  const { state, updateFormData } = useWizard();
  const selected = state.formData.selectedMarketplaces;

  const toggle = (code: string) => {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    updateFormData({
      selectedMarketplaces: next,
      // Auto-suggest currency from first selected marketplace
      ...(next.length === 1
        ? { primaryCurrency: marketplaceOptions.find((m) => m.code === next[0])?.defaultCurrency ?? 'EUR' }
        : {}),
    });
  };

  const regions = ['Americas', 'Europe', 'Asia Pacific', 'Middle East'] as const;

  return (
    <div className="space-y-3">
      {regions.map((region) => {
        const opts = marketplaceOptions.filter((m) => m.region === region);
        if (opts.length === 0) return null;
        return (
          <div key={region}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{region}</p>
            <div className="flex flex-wrap gap-1.5">
              {opts.map((mp) => {
                const isSelected = selected.includes(mp.code);
                return (
                  <button
                    key={mp.code}
                    onClick={() => toggle(mp.code)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? 'border-cx-400 bg-cx-50 text-cx-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{mp.flag}</span>
                    <span>{mp.code}</span>
                    {isSelected && <X className="w-3 h-3 text-cx-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white text-left"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-[200px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-cx-50 transition-colors ${
                  value === opt.value ? 'text-cx-700 bg-cx-50 font-medium' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CompanyInfoStep() {
  const { state, updateFormData } = useWizard();
  const { formData } = state;
  const [showTools, setShowTools] = useState(formData.selectedTools.length > 0);

  const toggleTool = (id: string) => {
    const next = formData.selectedTools.includes(id)
      ? formData.selectedTools.filter((t) => t !== id)
      : [...formData.selectedTools, id];
    updateFormData({ selectedTools: next });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h1>
      <p className="text-gray-500 text-sm mb-8">We'll use this to configure your dashboard.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Company / Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => updateFormData({ companyName: e.target.value })}
            placeholder="e.g. Acme Brands"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Amazon Marketplace(s) <span className="text-red-500">*</span>
          </label>
          <MarketplaceChipSelector />
        </div>

        <div className="max-w-[280px]">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Primary Currency
          </label>
          <CustomSelect
            value={formData.primaryCurrency}
            onChange={(val) => updateFormData({ primaryCurrency: val })}
            options={currencyOptions}
            placeholder="Select currency"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setShowTools(!showTools)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showTools ? 'rotate-180' : ''}`} />
            <span>Help us tailor your experience</span>
          </button>
          {showTools && (
            <div className="mt-4 animate-fade-slide-in">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Which analytics tools do you currently use?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {toolOptions.map((tool) => {
                  const isSelected = formData.selectedTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-150 ${
                        isSelected
                          ? 'border-cx-400 bg-cx-50 text-cx-700 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
