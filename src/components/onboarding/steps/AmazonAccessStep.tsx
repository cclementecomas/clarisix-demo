import { useState } from 'react';
import { Copy, Check, CheckCircle2, ChevronDown, Shield } from 'lucide-react';
import { useWizard } from '../../../contexts/OnboardingWizardContext';
import {
  sellerCentralSteps,
  permissionItems,
  faqItems,
  marketplaceOptions,
} from '../../../data/onboardingWizardData';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 my-3 px-4 py-3 bg-cx-50 border border-cx-200 rounded-lg">
      <code className="flex-1 text-sm font-semibold text-cx-700">{text}</code>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-cx-500 text-white hover:bg-cx-600'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Frequently asked questions</h3>
      <div className="space-y-1">
        {faqItems.map((item, i) => (
          <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">{item.question}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === i && (
              <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed animate-fade-slide-in">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AmazonAccessStep() {
  const { state, updateFormData } = useWizard();
  const { formData } = state;
  const hasMultipleMarketplaces = formData.selectedMarketplaces.length > 1;

  const toggleMarketplaceCheck = (code: string) => {
    updateFormData({
      marketplaceChecklist: {
        ...formData.marketplaceChecklist,
        [code]: !formData.marketplaceChecklist[code],
      },
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect your Amazon account</h1>
      <p className="text-gray-500 text-sm mb-8">
        We need view-only access to your Seller Central to pull your data. This is a one-time setup that takes about 3 minutes.
      </p>

      <div className="space-y-5">
        {sellerCentralSteps.map((step, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-cx-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
              {step.copyableText && <CopyButton text={step.copyableText} />}
              {i === 3 && (
                <div className="mt-3 space-y-2">
                  {permissionItems.map((perm) => (
                    <div key={perm} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{perm}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 mt-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                      We only need read access. We will never modify anything in your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMultipleMarketplaces && (
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium mb-3">
            If your marketplaces use separate Seller Central accounts, please repeat these steps for each account.
          </p>
          <div className="space-y-2">
            {formData.selectedMarketplaces.map((code) => {
              const mp = marketplaceOptions.find((m) => m.code === code);
              return (
                <label key={code} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.marketplaceChecklist[code]}
                    onChange={() => toggleMarketplaceCheck(code)}
                    className="w-4 h-4 rounded border-gray-300 text-cx-500 focus:ring-cx-300"
                  />
                  <span className="text-sm text-gray-700">
                    {mp?.flag} {mp?.label ?? code}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-white">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.accessConfirmed}
            onChange={() => updateFormData({ accessConfirmed: !formData.accessConfirmed })}
            className="w-4 h-4 rounded border-gray-300 text-cx-500 focus:ring-cx-300 mt-0.5"
          />
          <span className="text-sm text-gray-700 font-medium">
            {hasMultipleMarketplaces
              ? "I've sent invitations for all my Seller Central accounts"
              : "I've sent the invitation to connect@clarisix.com"}
          </span>
        </label>
      </div>

      <FAQSection />
    </div>
  );
}
