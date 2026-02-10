import { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const themes: { id: Theme; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function PreferencesSection() {
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Morgan');
  const [theme, setTheme] = useState<Theme>('light');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your personal information</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cx-300/50 focus:border-cx-300 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose how the application looks for you
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'border-cx-500 bg-cx-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-full aspect-[4/3] rounded-lg flex items-center justify-center transition-colors ${
                      t.id === 'dark'
                        ? 'bg-gray-900'
                        : t.id === 'system'
                          ? 'bg-gradient-to-r from-gray-100 to-gray-900'
                          : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        t.id === 'dark'
                          ? 'text-gray-300'
                          : t.id === 'system'
                            ? 'text-gray-500'
                            : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isActive ? 'border-cx-500' : 'border-gray-300'
                      }`}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cx-500" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${isActive ? 'text-cx-700' : 'text-gray-600'}`}
                    >
                      {t.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-cx-500 text-white hover:bg-cx-600 active:bg-cx-700 shadow-sm'
          }`}
        >
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
