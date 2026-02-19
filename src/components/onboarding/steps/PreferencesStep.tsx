import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useWizard } from '../../../contexts/OnboardingWizardContext';
import { fiscalYearMonths } from '../../../data/onboardingWizardData';

function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string | number; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label ?? '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white text-left"
      >
        <span className="text-gray-900">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-[200px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-cx-50 transition-colors ${
                  String(value) === String(opt.value) ? 'text-cx-700 bg-cx-50 font-medium' : 'text-gray-700'
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

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export default function PreferencesStep() {
  const { state, updateFormData } = useWizard();
  const { formData } = state;
  const [showTeam, setShowTeam] = useState(formData.teamInvites.length > 0);

  const addTeamMember = () => {
    updateFormData({
      teamInvites: [...formData.teamInvites, { name: '', email: '', role: 'viewer' }],
    });
  };

  const removeTeamMember = (index: number) => {
    updateFormData({
      teamInvites: formData.teamInvites.filter((_, i) => i !== index),
    });
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updated = formData.teamInvites.map((member, i) =>
      i === index ? { ...member, [field]: value } : member
    );
    updateFormData({ teamInvites: updated });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">A few final preferences</h1>
      <p className="text-gray-500 text-sm mb-8">You can always change these later in Settings.</p>

      <div className="space-y-6">
        <div className="max-w-[240px]">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Fiscal Year Starts
          </label>
          <CustomSelect
            value={String(formData.fiscalYearStart)}
            onChange={(val) => updateFormData({ fiscalYearStart: Number(val) })}
            options={fiscalYearMonths}
          />
        </div>

        <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Email notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Email me when my data is ready</p>
          </div>
          <button
            onClick={() => updateFormData({ emailNotifications: !formData.emailNotifications })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              formData.emailNotifications ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                formData.emailNotifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <button
            onClick={() => { setShowTeam(!showTeam); if (!showTeam && formData.teamInvites.length === 0) addTeamMember(); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showTeam ? 'rotate-180' : ''}`} />
            <span>Invite team members</span>
          </button>

          {showTeam && (
            <div className="mt-4 space-y-3 animate-fade-slide-in">
              {formData.teamInvites.map((member, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateTeamMember(i, 'name', e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300"
                  />
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => updateTeamMember(i, 'email', e.target.value)}
                    placeholder="Email"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300"
                  />
                  <select
                    value={member.role}
                    onChange={(e) => updateTeamMember(i, 'role', e.target.value)}
                    className="px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cx-300/50"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeTeamMember(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addTeamMember}
                className="flex items-center gap-1.5 text-sm text-cx-500 hover:text-cx-700 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another
              </button>
              <p className="text-xs text-gray-400 mt-1">
                You can always add more team members later from Settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
