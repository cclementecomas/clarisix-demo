import { useState, useEffect } from 'react';
import { Check, ShieldCheck, CreditCard, Scroll, Sparkles, PartyPopper, Tag } from 'lucide-react';
import { useWizard } from '../../../contexts/OnboardingWizardContext';
import { pricingPlans } from '../../../data/onboardingWizardData';

export default function PlanSelectionStep() {
  const { state, updateFormData } = useWizard();
  const { formData } = state;
  const [billing, setBilling] = useState<'annual' | 'monthly'>(formData.billingCycle || 'annual');
  const [analogCountdown, setAnalogCountdown] = useState<number | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  useEffect(() => {
    if (formData.selectedPlan !== 'analog') {
      setAnalogCountdown(null);
      return;
    }
    setAnalogCountdown(10);
    const interval = setInterval(() => {
      setAnalogCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          window.location.href = 'https://clarisix.com/analog';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [formData.selectedPlan]);

  const handleSelectPlan = (planId: string) => {
    updateFormData({ selectedPlan: planId, billingCycle: billing });
  };

  const handleBillingChange = (cycle: 'annual' | 'monthly') => {
    setBilling(cycle);
    if (formData.selectedPlan) {
      updateFormData({ billingCycle: cycle });
    }
  };

  const realPlans = pricingPlans.filter((p) => !p.joke);
  const analogPlan = pricingPlans.find((p) => p.joke);

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose your plan</h1>
        <p className="text-gray-500 text-base">
          Pick the plan that fits your business. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => handleBillingChange('annual')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              billing === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
          </button>
          <button
            onClick={() => handleBillingChange('monthly')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              billing === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
        </div>
        <div className="h-5">
          {billing === 'monthly' && (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
              Save 20% with annual billing
            </span>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {realPlans.map((plan) => {
          const isSelected = formData.selectedPlan === plan.id;
          const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;

          return (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-cx-500 bg-cx-50/50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-cx-300 hover:shadow-sm'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-cx-500 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              {/* Selection indicator */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'border-cx-500 bg-cx-500' : 'border-gray-300'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">{plan.name}</h3>

              <div className="mb-3">
                {price !== null ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">{'\u20AC'}{price}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                    {billing === 'annual' && plan.monthlyPrice !== null && (
                      <span className="text-sm text-gray-400 line-through">{'\u20AC'}{plan.monthlyPrice}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{'\u20AC'}{plan.annualPrice}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                )}
                {billing === 'annual' && price !== null && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Billed {'\u20AC'}{price * 12}/year
                  </p>
                )}
                {price === null && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Starting price, billed annually. Custom above.
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-2">{plan.description}</p>

              {plan.valueProp && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-cx-50 to-purple-50 border border-cx-200/60 mb-3">
                  <Sparkles className="w-3 h-3 text-cx-500" />
                  <span className="text-[11px] font-semibold text-cx-700">{plan.valueProp}</span>
                </div>
              )}

              <ul className="space-y-1.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* No charges callout */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg mb-6">
        <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 font-medium">
          No charges until your data is fully loaded and validated — saving you 1-2 days of waiting costs.
        </p>
      </div>

      {/* Credit card section */}
      {formData.selectedPlan && formData.selectedPlan !== 'analog' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Payment details</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Card number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cx-400 focus:ring-1 focus:ring-cx-200 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date</label>
              <input
                type="text"
                placeholder="MM / YY"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cx-400 focus:ring-1 focus:ring-cx-200 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CVC</label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cx-400 focus:ring-1 focus:ring-cx-200 placeholder:text-gray-300"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name on card</label>
              <input
                type="text"
                placeholder="Jane Smith"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cx-400 focus:ring-1 focus:ring-cx-200 placeholder:text-gray-300"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Secured with 256-bit SSL encryption. We never store your full card details.
          </p>

          {/* Discount code */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Have a discount code?</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountApplied(false);
                }}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cx-400 focus:ring-1 focus:ring-cx-200 placeholder:text-gray-300 uppercase tracking-wider"
              />
              <button
                onClick={() => discountCode.trim() && setDiscountApplied(true)}
                disabled={!discountCode.trim() || discountApplied}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  discountApplied
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : discountCode.trim()
                      ? 'bg-cx-500 text-white hover:bg-cx-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {discountApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {discountApplied && (
              <p className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1 animate-fade-slide-in">
                <Check className="w-3 h-3" />
                Discount code applied successfully.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Analog easter egg */}
      {analogPlan && (
        <div className="mt-2">
          <button
            onClick={() => handleSelectPlan('analog')}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
              formData.selectedPlan === 'analog'
                ? 'border-amber-400 bg-amber-50/50'
                : 'border-gray-200 hover:border-amber-300 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-gray-700">{analogPlan.name}</span>
                <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                  Free forever
                </span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                formData.selectedPlan === 'analog' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
              }`}>
                {formData.selectedPlan === 'analog' && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{analogPlan.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
              {analogPlan.features.map((f, i) => (
                <span key={i} className="text-[11px] text-gray-400 italic">{f}</span>
              ))}
            </div>
          </button>
        </div>
      )}

      {/* Analog redirect banner */}
      {formData.selectedPlan === 'analog' && analogCountdown !== null && (
        <div className="mt-6 px-5 py-4 bg-amber-50 border border-amber-300 rounded-xl text-center animate-fade-slide-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Excellent choice! Setup complete.</h3>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Your carrier pigeons are being dispatched. Redirecting you to your Analog dashboard in{' '}
            <span className="font-bold tabular-nums">{analogCountdown}</span> seconds...
          </p>
          <div className="mt-3 w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((10 - analogCountdown) / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
