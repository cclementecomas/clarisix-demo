import { Check, Zap, Crown, Building2 } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fc } from '../../utils/currency';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: '/mo',
    description: 'For individuals getting started',
    icon: Zap,
    features: ['1 connected account', 'Basic analytics', 'Email support', '7-day data retention'],
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    period: '/mo',
    description: 'For growing businesses',
    icon: Crown,
    features: [
      '5 connected accounts',
      'Advanced analytics',
      'Priority support',
      '90-day data retention',
      'Custom reports',
      'API access',
    ],
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: '/mo',
    description: 'For large-scale operations',
    icon: Building2,
    features: [
      'Unlimited accounts',
      'Full analytics suite',
      'Dedicated support',
      'Unlimited retention',
      'Custom reports',
      'API access',
      'SSO & SAML',
      'Custom integrations',
    ],
    current: false,
  },
];

export default function SubscriptionSection() {
  const { currency } = useCurrency();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Current Plan</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            You are on the <span className="font-semibold text-cx-600">Pro</span> plan, billed
            monthly
          </p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cx-50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-cx-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Pro Plan</p>
              <p className="text-xs text-gray-500">Next billing on March 1, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {fc(79, currency, { decimals: 0 })}<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border-2 transition-all duration-200 ${
                  plan.current
                    ? 'border-cx-500 bg-cx-50/30 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        plan.current ? 'bg-cx-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${plan.current ? 'text-cx-600' : 'text-gray-500'}`}
                      />
                    </div>
                    {plan.current && (
                      <span className="text-[10px] font-semibold text-cx-700 bg-cx-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Current
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{plan.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                  <div className="mt-3 mb-4">
                    <span className="text-2xl font-bold text-gray-900">{fc(plan.price, currency, { decimals: 0 })}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check
                          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                            plan.current ? 'text-cx-500' : 'text-gray-400'
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 pb-5">
                  <button
                    className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors ${
                      plan.current
                        ? 'bg-cx-500 text-white cursor-default'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.current ? 'Current Plan' : 'Switch Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
